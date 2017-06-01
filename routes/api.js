const express = require('express');
const router = express.Router();
const schema = require('../db/schema');
const FirebaseManager = require('../managers/firebase-manager');
const {logger} = require('../helpers/init');
const LoginManager = require('../helpers/communication');
const {notification, errorHandler, httpCode} = require('../helpers/enum');

/**
 * Placeholder to show an entry point.
 */
router.get('/', function(req, res) {
    if (req.auth) {
        res.send('Welcome to this chat!');
    } else {
        res.sendStatus(errorHandler.NOT_AUTHORIZED);
    }
});

/**
 * Create a new chat, of either single or group.
 * Returns id of created chat.
 * Chat can be created without users. Type is required.
 */
router.post('/chat', function(req, res) {
    if (req.auth) {
        var chat = req.body;
        if (schema.validateChat(chat)) {
            FirebaseManager.createChat(chat)
                .then(function (chatId) {
                    res.setHeader('Content-Type', 'application/json');
                    res.status(httpCode.CREATED).send(JSON.stringify({ 'id': chatId }));
                })
                .catch(function (error) {
                    res.sendStatus(errorHandler.INTERNAL_SERVER_ERROR);
                });
        } else {
            res.sendStatus(errorHandler.BAD_REQUEST);
        }
    } else {
        res.sendStatus(errorHandler.NOT_AUTHORIZED);
    }
});

/**
 * Update name and/or image of a specific chat.
 */
router.put('/chat/:chatid', function(req, res) {
    if (req.auth) {
        var chat = req.body;
        if (schema.validateChatUpdate(chat)) {
            FirebaseManager.updateChat(chat)
                .then(function () {
                    res.sendStatus(httpCode.OK);
                })
                .catch(function (error) {
                    res.sendStatus(errorHandler.INTERNAL_SERVER_ERROR);
                });
        } else {
            res.sendStatus(errorHandler.BAD_REQUEST);
        }
    } else {
        res.sendStatus(errorHandler.NOT_AUTHORIZED);
    }
});

/**
 * Add participants to a specific chat.
 * This API is used for both single and group chat.
 * Users will be added as not admin!
 * Every user added in a group will receive a notification.
 */
router.put('/chat/:chatid/users/add', function(req, res) {
    if (req.auth) {
        var chatId = req.params.chatid;
        var usersArray = req.body["users"];
        FirebaseManager.getChatInfo(chatId)
            .then(function(response) {
                var chatName = response["name"];
                if (response["type"] == "GROUP") { //If group then add every user
                    FirebaseManager.addUser(usersArray, chatId)
                        .then(function () {
                            res.sendStatus(httpCode.OK);
                            createAndSendAddedNotification(usersArray, chatName);
                        })
                        .catch(function (error) {
                            res.sendStatus(errorHandler.INTERNAL_SERVER_ERROR);
                        });
                } else if (response["type"] == "SINGLE") {
                    if (response["users"].length == 0) {
                        // Accept two new participants
                        if (usersArray.length < 2) {
                            FirebaseManager.addUser(usersArray, chatId)
                                .then(function () {
                                    res.sendStatus(httpCode.OK);
                                })
                                .catch(function (error) {
                                    res.sendStatus(errorHandler.INTERNAL_SERVER_ERROR);
                                });
                        } else {
                            res.sendStatus(errorHandler.BAD_REQUEST);
                        }
                    } else {
                        res.sendStatus(errorHandler.BAD_REQUEST);
                    }
                }
            })
            .catch(function (error) {
                res.sendStatus(errorHandler.INTERNAL_SERVER_ERROR);
            });
    } else {
        res.sendStatus(errorHandler.NOT_AUTHORIZED);
    }
});

/**
 * Create and post a new message to a chat.
 * Send notification to user involved in that chat.
 */
router.post('/chat/:chatid/message', function(req, res) {
    if (req.auth) {
        var message = req.body;
        if (schema.validateMessage(message)) {
            message["timestamp"] = Date.now();
            FirebaseManager.saveMessage(message)
                .then(function (message) {
                    res.status(201).send(message);
                })
                .catch(function (error) {
                    res.sendStatus(error);
                });
            // Get users in chat and send a notification to them.
            FirebaseManager.getChatUsers(req.params.chatid)
                .then(function (users) {
                    let usersInChat = [];
                    users.forEach(function(u) {
                        // Don't send notification to the message sender.
                        if (u.id == message.sender.id) {
                            return;
                        }
                        usersInChat.push(u.id);
                    });
                    // Get token from LOGIN module, passing all participants in chat :chatid
                    var usersInChatObject = {'users': usersInChat};
                    console.log('USERS: ' + JSON.stringify(usersInChatObject));

                    LoginManager.getFirebaseToken(usersInChatObject)
                        .then(function(tokens) {
                            FirebaseManager.sendMessage(tokens, notification.MESSAGE, message.text, {custom: "This is a custom field!"})
                                .then(function (response) {
                                    console.log('Notification sent');
                                })
                                .catch(function (error) {
                                    console.log('Notification not sent');
                                });
                        })
                        .catch(function(error) {
                            console.log('.....Impossible to retrieve tokens ' + error);
                        });

                })
                .catch(function (error) {
                    console.log('Impossible to send notification. ' + error);
                });
        } else {
            res.sendStatus(errorHandler.BAD_REQUEST);
        }
    } else {
        res.sendStatus(errorHandler.NOT_AUTHORIZED);
    }
});

/**
 * Exit chat. It removes a user from a specific chat when it decides to leave it.
 */
router.put('/chat/:chatid/users/:userid/remove', function(req,res) {
    if (req.auth) {
        FirebaseManager.removeUser(req.params.userid, req.params.chatid)
            .then(function () {
                res.sendStatus(httpCode.OK);
            })
            .catch(function (error) {
                res.sendStatus(error);
            });
    } else {
        res.sendStatus(errorHandler.NOT_AUTHORIZED);
    }
});

/**
 * Get chats list of specific user.
 * Return an array of chats, with every information, users with role included.
 * NOTE: This method will not return deleted chats.
 */
router.get('/chat/all/user/:userid', function(req,res) {
    if (req.auth) {
        FirebaseManager.getChats(req.params.userid)
            .then(function (chats) {
                res.setHeader('Content-Type', 'application/json');
                // Filter chats in order to remove empty values (due to deleted chats), returned from Firebase function
                let filteredChats = chats.filter(function(e) {
                    return e!=null;
                });
                res.status(httpCode.OK).send({"chats": filteredChats});
            })
            .catch(function (error) {
                res.sendStatus(error);
            });
    } else {
        res.sendStatus(errorHandler.NOT_AUTHORIZED);
    }
});

/**
 * Get all messages in a chat.
 */
router.get('/chat/:chatid/message/all', function(req,res) {
    if (req.auth) {
        FirebaseManager.getAllMessages(req.params.chatid)
            .then(function (messages) {
                res.setHeader('Content-Type', 'application/json');
                res.status(httpCode.OK).send({"messages": messages});
            })
            .catch(function (error) {
                res.sendStatus(error);
            });
    } else {
        res.sendStatus(errorHandler.NOT_AUTHORIZED);
    }
});

/**
 * Get latest message (one only) of a specific chat.
 */
router.get('/chat/:chatid/lastmessage', function(req, res) {
    if (req.auth) {
        FirebaseManager.getLastMessage(req.params.chatid)
            .then(function (result) {
                res.status(201).send(result);
            })
            .catch(function () {
                res.status(404).send('404');
            });
    } else {
        res.sendStatus(errorHandler.NOT_AUTHORIZED);
    }
});

/**
 * Get information and status of a chat.
 */
router.get('/chat/:chatid', function(req,res) {
    if (req.auth) {
        FirebaseManager.getChatInfo(req.params.chatid)
            .then(function (info) {
                res.setHeader('Content-Type', 'application/json');
                res.status(httpCode.OK).send(info);
            })
            .catch(function (error) {
                res.sendStatus(error);
            });
    } else {
        res.sendStatus(errorHandler.NOT_AUTHORIZED);
    }
});

/**
 * Get participants of a chat.
 */
router.get('/chat/:chatid/user/all', function(req,res) {
    if (req.auth) {
        FirebaseManager.getChatUsers(req.params.chatid)
            .then(function (users) {
                res.setHeader('Content-Type', 'application/json');
                res.status(httpCode.OK).send({"users": users});
            })
            .catch(function (error) {
                res.sendStatus(error);
            });
    } else {
        res.sendStatus(errorHandler.NOT_AUTHORIZED);
    }
});

/**
 * Change status of a participant of a chat.
 * Operation permitted if and only if sender is admin.
 */
router.put('/chat/:chatid/users/:userid/role', function(req,res) {
    if (req.auth) {
        var chatId = req.params.chatid;
        var userIdToUpdate = req.params.userid;
        let sender = req.sender;
        FirebaseManager.getUserRoleInChat(sender, chatId)
            .then(function(senderRole) {
                if (senderRole == 'USER') { //Users cannot change roles
                    res.sendStatus(errorHandler.NOT_AUTHORIZED);
                } else if (senderRole == 'ADMIN' && sender == userIdToUpdate) { //Don't let admin to change himself status.
                    res.sendStatus(errorHandler.NOT_AUTHORIZED);
                } else {
                    FirebaseManager.getUserRoleInChat(userIdToUpdate, chatId)
                        .then(function(roleToChange) {
                            var newStatus = (roleToChange == 'USER' ? 'ADMIN' : 'USER');
                            FirebaseManager.setUserRole(chatId, userIdToUpdate, newStatus)
                                .then(function (result) {
                                    res.setHeader('Content-Type', 'application/json');
                                    res.status(httpCode.OK).send(result);
                                })
                                .catch(function (error) {
                                    res.sendStatus(error);
                                });
                        });
                }
            })
            .catch(function (error) {
               res.sendStatus(errorHandler.INTERNAL_SERVER_ERROR);
            });
    } else {
        res.sendStatus(errorHandler.NOT_AUTHORIZED);
    }
});

/**
 * Delete chat, set a flag on it.
 */
router.delete('/chat/:chatid', function (req,res) {
    if (req.auth) {
        FirebaseManager.deleteChat(req.params.chatid)
            .then(function () {
                res.status(201).send('201');
            })
            .catch(function (error) {
                res.status(404).send(error);
            });
    } else {
        res.sendStatus(errorHandler.NOT_AUTHORIZED);
    }
});

/* NOTIFICATION HELPERS */
function createAndSendNotification(usersArray) {
    LoginManager.getFirebaseToken(usersArray)
        .then(function (tokens) {
            FirebaseManager.sendMessage(tokens, message.sender.name, message.text, {custom: "This is a custom field!"})
                .then(function (response) {
                    logger.info('Notification sent');
                })
                .catch(function (error) {
                    logger.info('Notification not sent');
                });
        })
        .catch(function (error) {
            logger.info('Impossible to retrieve tokens');
        });
}

function createAndSendAddedNotification(usersArray, groupName) {
    LoginManager.getFirebaseToken(usersArray)
        .then(function (tokens) {
            FirebaseManager.sendMessage(tokens, groupName, notification.ADDED, {custom: "This is a custom field!"})
                .then(function (response) {
                    logger.info('Notification sent');
                })
                .catch(function (error) {
                    logger.info('Notification not sent');
                });
        })
        .catch(function (error) {
            logger.info('Impossible to retrieve tokens');
        });
}

module.exports = router;