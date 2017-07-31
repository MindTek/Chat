const express = require('express');
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' });
const router = express.Router();
const schema = require('../db/schema');
const FirebaseManager = require('../managers/firebase-manager');
const logger = require('winston');
const LoginManager = require('../helpers/communication');
const {notification, errorHandler, httpCode} = require('../helpers/enum');
var path = require('path');

/**
 * Placeholder to show an entry point.
 */
router.get('/', function(req, res) {
    logger.info(Date() + ' - ' + req.method + ' /api' + req.path);
    res.sendFile(path.join(__dirname + '/../pages/status.html'));
});

/**
 * Create a new chat, of either single or group.
 * Returns id of created chat.
 * Chat can be created without users. Type is required.
 */
router.post('/chat', function(req, res) {
    logger.info(Date() + ' - ' + req.method + ' /api' + req.path);
    if (req.auth) {
        var chat = req.body;
        var sender = req.sender;
        if (schema.validateChat(chat)) {
                FirebaseManager.createChat(chat, sender)
                    .then((chatId) => {
                        res.setHeader('Content-Type', 'application/json');
                        let createdChat = chat;
                        chat['id'] = chatId;
                        res.status(httpCode.CREATED).send(JSON.stringify(chat));
                    })
                    .catch((error) => {
                        logger.info(Date() + ' - ' + errorHandler.INTERNAL_SERVER_ERROR +': ' + error);
                        res.sendStatus(errorHandler.INTERNAL_SERVER_ERROR);
                    });
        } else {
            logger.info(Date() + ' - ' + errorHandler.BAD_REQUEST);
            res.sendStatus(errorHandler.BAD_REQUEST);
        }
    } else {
        logger.info(Date() + ' - ' + errorHandler.NOT_AUTHORIZED);
        res.sendStatus(errorHandler.NOT_AUTHORIZED);
    }
});

/**
 * Update name and/or image of a specific chat.
 */
router.put('/chat/:chatid', function(req, res) {
    logger.info(Date() + ' - ' + req.method + ' /api' + req.path);
    if (req.auth) {
        var chat = req.body;
        if (schema.validateChatUpdate(chat)) {
            FirebaseManager.updateChat(req.params.chatid, chat)
                .then((result) => {
                    res.sendStatus(result);
                })
                .catch((error) => {
                    logger.info(Date() + ' - ERROR: ' + error);
                    res.sendStatus(error);
                });
        } else {
            logger.info(Date() + ' - ' + errorHandler.BAD_REQUEST);
            res.sendStatus(errorHandler.BAD_REQUEST);
        }
    } else {
        logger.info(Date() + ' - ' + errorHandler.NOT_AUTHORIZED);
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
    logger.info(Date() + ' - ' + req.method + ' /api' + req.path);
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
                            logger.info(Date() + ' - ' + errorHandler.INTERNAL_SERVER_ERROR +': ' + error);
                            res.sendStatus(errorHandler.INTERNAL_SERVER_ERROR);
                        });
                } else if (response["type"] == "SINGLE") {
                    let chatUsers = response["users"];
                    let numberOfUsersInChat = Object.keys(chatUsers).length;
                    let numberOfUsersToAdd = usersArray.length;
                    // Accept only one participant, since there is a default admin for every chat
                    if (numberOfUsersInChat == 1 && numberOfUsersToAdd == 1) {
                        FirebaseManager.addUser(usersArray, chatId)
                            .then(function () {
                                res.sendStatus(httpCode.OK);
                            })
                            .catch(function (error) {
                                logger.info(Date() + ' - ' + errorHandler.INTERNAL_SERVER_ERROR +': ' + error);
                                res.sendStatus(errorHandler.INTERNAL_SERVER_ERROR);
                            });
                    } else {
                        res.sendStatus(errorHandler.BAD_REQUEST);
                    }
                } else {
                    logger.info(Date() + ' - ' + errorHandler.INTERNAL_SERVER_ERROR +': ' + error);
                    res.sendStatus(errorHandler.INTERNAL_SERVER_ERROR);
                }
            })
            .catch(function (error) {
                logger.info(Date() + ' - ' + errorHandler.NOT_FOUND +': ' + error);
                res.sendStatus(errorHandler.NOT_FOUND);
            });
    } else {
        logger.info(Date() + ' - ' + errorHandler.NOT_AUTHORIZED);
        res.sendStatus(errorHandler.NOT_AUTHORIZED);
    }
});

/**
 * Add participants to a specific chat, with the specified role.
 * Every user added in a group will receive a notification.
 * This endpoint CANNOT be used to add participants to single chat. Use the endpoint '/chat/:chatid/users/add'
 */
router.put('/chat/:chatid/users/addrole', function(req, res) {
    logger.info(Date() + ' - ' + req.method + ' /api' + req.path);
    if (req.auth) {
        var chatId = req.params.chatid;
        var usersArray = req.body["users"];
        FirebaseManager.getChatInfo(chatId)
            .then(function(response) {
                var chatName = response["name"];
                if (response["type"] == "GROUP") { //If group then add every user
                    FirebaseManager.addUserWithRole(usersArray, chatId)
                        .then(function () {
                            res.sendStatus(httpCode.OK);
                            let usersIds = [];
                            for (var userKey in usersArray) {
                                usersIds.push(usersArray[userKey].id);
                            }
                            let usersObj = {"users": usersIds};
                            createAndSendAddedNotification(usersObj, chatName);
                        })
                        .catch(function (error) {
                            logger.info(Date() + ' - ' + errorHandler.INTERNAL_SERVER_ERROR +': ' + error);
                            res.sendStatus(errorHandler.INTERNAL_SERVER_ERROR);
                        });
                } else { // Bad request or chat is single
                    logger.info(Date() + ' - ' + errorHandler.BAD_REQUEST);
                    res.sendStatus(errorHandler.BAD_REQUEST);
                }
            })
            .catch(function (error) {
                logger.info(Date() + ' - ' + errorHandler.NOT_FOUND);
                res.sendStatus(errorHandler.NOT_FOUND);
            });
    } else {
        logger.info(Date() + ' - ' + errorHandler.NOT_AUTHORIZED);
        res.sendStatus(errorHandler.NOT_AUTHORIZED);
    }
});

/**
 * Create and post a new message to a chat.
 * Send notification to user involved in that chat.
 * This methods is multipart, because a message can contain additional data, which will be uploaded to an external server.
 */
router.post('/chat/:chatid/message', upload.single('file'), function(req, res) {
    logger.info(Date() + ' - ' + req.method + ' /api' + req.path);
    if (req.auth) {
        var attachment = req.file;
        // Parse message as JSON since it's multipart and it doesn't have correct content type
        var message = JSON.parse(req.body.message);
        var chatid = req.params.chatid;
        if (schema.validateMessage(message)) {
            logger.info(Date() + ' - ' + 'Received a request for send message ' + message);
            if (attachment) {
                // Post file to external service
                LoginManager.postFile(attachment)
                .then((result) => {
                    logger.info(Date() + ' - ' + 'Got attachment URL: ' + result);
                    message['url'] = result;
                    saveMessage(message, chatid, req, res);
                })
                .catch((error) => {
                    logger.info(Date() + ' - ' + errorHandler.INTERNAL_SERVER_ERROR +': No attachment ' + error);
                    res.sendStatus(errorHandler.INTERNAL_SERVER_ERROR);
                });
            } else { //No attachment
                saveMessage(message, chatid, req, res);
            }      
        } else {
            logger.info(Date() + ' - ' + errorHandler.BAD_REQUEST);
            res.sendStatus(errorHandler.BAD_REQUEST);
        }
    } else {
        logger.info(Date() + ' - ' + errorHandler.NOT_AUTHORIZED);
        res.sendStatus(errorHandler.NOT_AUTHORIZED);
    }
});

function saveMessage(message, chatid, req, res) {
    // Check that sender is participating to that chat (and that chat exists)
    let userId = message["sender"]["id"];
    FirebaseManager.getChatUsers(chatid)
        .then((users) => {
            logger.info(Date() + ' - ' + 'Retrieved ' + users.length + ' users in chat ' + chatid);
            let usersInChat = [];
            let isUserInChat = false;
            users.forEach(function (u) {
                // Don't send notification to the message sender.
                if (u.id == message.sender.id) {
                    isUserInChat = true;
                }
                usersInChat.push(u.id);
            });
            if (!isUserInChat) {
                logger.info(Date() + ' - ' + 'User with id ' + message.sender.id + ' not found in chat ' + chatid);
                res.sendStatus(errorHandler.NOT_FOUND);
            } else {
                message["timestamp"] = Date.now().toString();
                message["chat_id"] = chatid;
                FirebaseManager.saveMessage(message)
                    .then(function (message) {
                        logger.info(Date() + ' - ' + 'Message saved');
                        var messageToSend = {
                            "message_id":message["message_id"],
                            "chat_id":message["chat_id"],
                            "sender_id":message["sender"]["id"],
                            "text":message["text"],
                            "type":message["type"],
                            "url":"",
                            "timestamp":message["timestamp"]
                        };
                        if (message["url"]) {
                            messageToSend["url"] = message["url"];
                        } 
                        res.status(201).send(message);
                        // Get token from LOGIN module, passing all participants in chat :chatid
                        var usersInChatObject = {'users': usersInChat};
                        LoginManager.getFirebaseToken(usersInChatObject)
                            .then(function (tokens) {
                                // Send a notification to all users in chat, except the sender.
                                logger.info(Date() + ' - ' + 'Message to send: '+ JSON.stringify(messageToSend));
                                FirebaseManager.sendMessage(tokens, notification.MESSAGE, message.text, messageToSend)
                                    .then(function (response) {
                                        logger.info(Date() + ' - ' + 'Notification sent!');
                                    })
                                    .catch(function (error) {
                                        logger.info(Date() + ' - ' + 'Notification not sent: ' + error);
                                    });
                            })
                            .catch(function (error) {
                                logger.info(Date() + ' - ' + 'Impossible to retrieve Firebase token for user ' + message.sender.id);
                            });
                            })
                            .catch(function (error) {
                                logger.info(Date() + ' - ' + 'Error saving message!');
                                res.sendStatus(error);
                            });
            }
        })
        .catch((error) => {
            res.sendStatus(error);
        });
}

/**
 * Exit chat. It removes a user from a specific chat when it decides to leave it.
 */
router.put('/chat/:chatid/users/:userid/remove', function(req,res) {
    logger.info(Date() + ' - ' + req.method + ' /api' + req.path);
    if (req.auth) {
        FirebaseManager.removeUser(req.params.userid, req.params.chatid)
            .then(function () {
                res.sendStatus(httpCode.OK);
            })
            .catch(function (error) {
                logger.info(Date() + ' - ERROR: ' + error);
                res.sendStatus(error);
            });
    } else {
        logger.info(Date() + ' - ' + errorHandler.NOT_AUTHORIZED);
        res.sendStatus(errorHandler.NOT_AUTHORIZED);
    }
});

/**
 * Get chats list of specific user.
 * Return an array of chats, with every information, users with role included.
 * NOTE: This method will not return deleted chats.
 */
router.get('/chat/all/user/:userid', function(req,res) {
    logger.info(Date() + ' - ' + req.method + ' /api' + req.path);
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
                logger.info(Date() + ' - ERROR: ' + error);
                res.sendStatus(error);
            });
    } else {
        logger.info(Date() + ' - ' + errorHandler.NOT_AUTHORIZED);
        res.sendStatus(errorHandler.NOT_AUTHORIZED);
    }
});

/**
 * Get all messages in a chat.
 */
router.get('/chat/:chatid/message/all', function(req,res) {
    logger.info(Date() + ' - ' + req.method + ' /api' + req.path);
    if (req.auth) {
        FirebaseManager.getAllMessages(req.params.chatid)
            .then(function (messages) {
                res.setHeader('Content-Type', 'application/json');
                res.status(httpCode.OK).send({"messages": messages});
            })
            .catch(function (error) {
                logger.info(Date() + ' - ERROR: ' + error);
                res.sendStatus(error);
            });
    } else {
        logger.info(Date() + ' - ' + errorHandler.NOT_AUTHORIZED);
        res.sendStatus(errorHandler.NOT_AUTHORIZED);
    }
});

/**
 * Get latest message (one only) of a specific chat.
 */
router.get('/chat/:chatid/lastmessage', function(req, res) {
    logger.info(Date() + ' - ' + req.method + ' /api' + req.path);
    if (req.auth) {
        FirebaseManager.getLastMessage(req.params.chatid)
            .then(function (result) {
                res.status(httpCode.OK).send(result);
            })
            .catch(function (error) {
                logger.info(Date() + ' - ERROR: ' + error);
                res.sendStatus(error);
            });
    } else {
        logger.info(Date() + ' - ' + errorHandler.NOT_AUTHORIZED);
        res.sendStatus(errorHandler.NOT_AUTHORIZED);
    }
});

/**
 * Get information and status of a chat.
 */
router.get('/chat/:chatid', function(req,res) {
    logger.info(Date() + ' - ' + req.method + ' /api' + req.path);
    if (req.auth) {
        FirebaseManager.getChatInfo(req.params.chatid)
            .then(function (info) {
                res.setHeader('Content-Type', 'application/json');
                info["id"] = req.params.chatid;
                res.status(httpCode.OK).send(info);
            })
            .catch(function (error) {
                logger.info(Date() + ' - ERROR: ' + error);
                res.sendStatus(error);
            });
    } else {
        logger.info(Date() + ' - ' + errorHandler.NOT_AUTHORIZED);
        res.sendStatus(errorHandler.NOT_AUTHORIZED);
    }
});

/**
 * Get participants of a chat.
 */
router.get('/chat/:chatid/user/all', function(req,res) {
    logger.info(Date() + ' - ' + req.method + ' /api' + req.path);
    if (req.auth) {
        FirebaseManager.getChatUsers(req.params.chatid)
            .then(function (users) {
                res.setHeader('Content-Type', 'application/json');
                res.status(httpCode.OK).send({"users": users});
            })
            .catch(function (error) {
                logger.info(Date() + ' - ERROR: ' + error);
                res.sendStatus(error);
            });
    } else {
        logger.info(Date() + ' - ' + errorHandler.NOT_AUTHORIZED);
        res.sendStatus(errorHandler.NOT_AUTHORIZED);
    }
});

/**
 * Change status of a participant of a chat.
 * Operation permitted if and only if sender is admin.
 */
router.put('/chat/:chatid/users/:userid/role', function(req,res) {
    logger.info(Date() + ' - ' + req.method + ' /api' + req.path);
    if (req.auth) {
        var chatId = req.params.chatid;
        var userIdToUpdate = req.params.userid;
        let sender = req.sender;
        FirebaseManager.getUserRoleInChat(sender, chatId)
            .then(function(senderRole) {
                if (senderRole == 'USER') { //Users cannot change roles
                    logger.info(Date() + ' - ' + errorHandler.NOT_AUTHORIZED);
                    res.sendStatus(errorHandler.NOT_AUTHORIZED);
                } else if (senderRole == 'ADMIN' && sender == userIdToUpdate) { //Don't let admin to change himself status.
                    logger.info(Date() + ' - ' + errorHandler.NOT_AUTHORIZED);
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
                                    logger.info(Date() + ' - ERROR: ' + error);
                                    res.sendStatus(error);
                                });
                        })
                        .catch(function (error) {
                            logger.info(Date() + ' - ERROR: ' + error);
                            res.sendStatus(error);
                        });
                }
            })
            .catch(function (error) {
                logger.info(Date() + ' - ERROR: ' + error);
               res.sendStatus(error);
            });
    } else {
        logger.info(Date() + ' - ' + errorHandler.NOT_AUTHORIZED);
        res.sendStatus(errorHandler.NOT_AUTHORIZED);
    }
});

/**
 * Delete chat, set a flag on it.
 */
router.delete('/chat/:chatid', function (req,res) {
    logger.info(Date() + ' - ' + req.method + ' /api' + req.path);
    if (req.auth) {
        FirebaseManager.deleteChat(req.params.chatid)
            .then(function (result) {
                res.sendStatus(result);
            })
            .catch(function (error) {
                logger.info(Date() + ' - ERROR: ' + error);
                res.sendStatus(error)
            });
    } else {
        logger.info(Date() + ' - ' + errorHandler.NOT_AUTHORIZED);
        res.sendStatus(errorHandler.NOT_AUTHORIZED);
    }
});

/* NOTIFICATION HELPERS */
function createAndSendNotification(usersArray) {
    LoginManager.getFirebaseToken(usersArray)
        .then(function (tokens) {
            FirebaseManager.sendMessage(tokens, message.sender.name, message.text, {})
                .then(function (response) {
                    logger.info(Date() + ' - Notification sent');
                })
                .catch(function (error) {
                    logger.info(Date() + ' - Notification not sent: ' + error);
                });
        })
        .catch(function (error) {
            logger.info(Date() + ' - Impossible to retrieve tokens: ' + error);
        });
}

function createAndSendAddedNotification(usersArray, groupName) {
    LoginManager.getFirebaseToken(usersArray)
        .then(function (tokens) {
            FirebaseManager.sendMessage(tokens, groupName, notification.NEWUSERADDED, {"code": "USERADDED"})
                .then(function (response) {
                    logger.info(Date() + ' - Notification sent');
                })
                .catch(function (error) {
                    logger.info(Date() + ' - Notification not sent: ' + error);
                });
        })
        .catch(function (error) {
            logger.info(Date() + ' - Impossible to retrieve tokens: ' + error);
        });
}

module.exports = router;