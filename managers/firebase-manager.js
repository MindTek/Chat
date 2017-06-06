const Firebase = require('firebase-admin');
const Promise = require('promise');
const {logger} = require('../helpers/init');
const serviceAccount = require('./../config/serviceAccountKey.json');
const {notification, errorHandler, httpCode} = require('../helpers/enum');

var status;
var firebaseConfig;
var firebaseApp;
var error;

var FirebaseManager = function () {
    // Initialize firebase app
    try {
        connectToFirebase();
        status = FirebaseManager.STATUS_CONNECTED;
    } catch (err) {
        status = FirebaseManager.STATUS_ERROR;
    }
};
FirebaseManager.prototype.getFirebaseConfig = function () {
    return firebaseConfig;
};

/* NOTIFICATIONS */
FirebaseManager.prototype.sendMessage = function (tokens, payload) {
    switch (status) {
        case FirebaseManager.STATUS_CONNECTED:
            return this.getFirebaseApp().messaging().sendToDevice(tokens, payload);
            break;
        case FirebaseManager.STATUS_ERROR:
            throw this.getError();
            break
        case FirebaseManager.STATUS_NOT_CONNECTED:
            throw new Error("Firebase app not connected!");
            break
    }
};
FirebaseManager.prototype.sendMessage = function (tokens, notificationTitle, notificationBody, customData) {

    if (status === FirebaseManager.STATUS_CONNECTED) {
        return this.getFirebaseApp().messaging().sendToDevice(tokens, {
            notification: {
                title: notificationTitle,
                body: notificationBody
            },
            data: customData
        });
    } else {
        var error = this.getError();
        if (error) {
            throw error;
        } else {
            this.error = new Error("Cannot send messages, the firebase app is not connected");
            throw this.error;
        }
    }
};

/* API */
/**
 * Create a new chat, inserting a new node in chat element.
 * Sender will be added as first admin.
 */
FirebaseManager.prototype.createChat = function (newChat, senderId) {
    var self = this;
    var chatRef = this.getChatsRef();
    var p = new Promise(function (resolve, reject) {
        if (status === FirebaseManager.STATUS_CONNECTED) {
            var newChatRef = chatRef.push(newChat);
            var chatId = newChatRef.key;
            // Add users as admin
            self.addAdminUser(senderId, chatId)
                .then(function(result) {
                    resolve(chatId);
                })
                .catch(function(error) {
                    reject(error);
                });
        } else {
            reject(errorHandler.INTERNAL_SERVER_ERROR);
        }
    });
    return p;
};

/**
 * Add admins when chat is created.
 */
FirebaseManager.prototype.addAdminUser = function (userId, chatId) {
    console.log('adding user..');
    var chatRef = this.getChatsRef();
    var userRef = this.getUsersRef();
    var p = new Promise(function (resolve, reject) {
        if (status === FirebaseManager.STATUS_CONNECTED) {
            // Add user ref from chat
            let newAdminUser = {"id": userId, "role": "ADMIN"};
            console.log('1' + chatId);
            console.log('2' + userId);
            chatRef.child(chatId).child('users').child(userId).set(newAdminUser, function(error) {
                console.log('chat ref');
                if (error) {
                    reject(errorHandler.INTERNAL_SERVER_ERROR);
                } else {
                    // Update user ref
                    var newChat = {};
                    newChat[chatId] = chatId;
                    userRef.child(userId).child("chats").update(newChat, function(error) {
                        if (error) {
                            console.log('user ref');
                            reject(errorHandler.INTERNAL_SERVER_ERROR);
                        } else {
                            resolve(httpCode.OK);
                        }
                    });
                }
            });
        } else {
            reject(errorHandler.INTERNAL_SERVER_ERROR);
        }
    });
    return p;
};

/**
 * Create a new user entry inside users node.
 */
FirebaseManager.prototype.createUser = function (newUser) {
    let userRef = this.getUsersRef();
    var p = new Promise(function (resolve, reject) {
        if (status === FirebaseManager.STATUS_CONNECTED) {
            userRef.child(newUser.id).set(newUser)
                .then(function() {
                    resolve(httpCode.OK);
                })
                .catch(function() {
                    reject(errorHandler.INTERNAL_SERVER_ERROR);
                });
        } else {
            reject(errorHandler.INTERNAL_SERVER_ERROR);
        }
    });
    return p;
};

/**
 * Post a new message to a specific chat.
 * It creates a new entry inside message node.
 * Update chat with latest message.
 * Notification is not sent here.
 */
FirebaseManager.prototype.saveMessage = function (newMessage) {
    var messageRef = this.getMessagesRef();
    var p = new Promise(function(resolve, reject) {
        if (status === FirebaseManager.STATUS_CONNECTED) {
            var newMessageRef = messageRef.push(newMessage, function (error) {
                if (error) {
                    reject(errorHandler.INTERNAL_SERVER_ERROR);
                }
            });
            var messagePosted = newMessageRef.key;
            resolve({"id": messagePosted});
        } else {
            reject(errorHandler.INTERNAL_SERVER_ERROR);
        }
    });
    // Update chat with latest message
    var lastMessage = {"last_message": newMessage};
    var chatRef = this.getChatsRef();
    chatRef.child(newMessage.chat_id).update(lastMessage, function(error) {
        if (error) {
            logger.info('Chat last message not updated!');
        }
    });
    return p;
};


/**
 * Get all messages of a specific chat.
 */
FirebaseManager.prototype.getAllMessages = function (chatId) {
    var messageRef = this.getMessagesRef();
    var p = new Promise(function (resolve, reject) {
        if (status === FirebaseManager.STATUS_CONNECTED) {
            messageRef.orderByChild('chat_id').equalTo(chatId).once('value', function (snapshot) {
                var messages = new Array();
                var result = snapshot.val();
                // Build array for client
                for (var mess in result) {
                    messages.push(result[mess]);
                }
                resolve(messages);
            }), function (error) {
                if (error) {
                    reject(errorHandler.NOT_FOUND);
                }
            }
        } else {
            reject(errorHandler.INTERNAL_SERVER_ERROR);
        }
    });
    return p;
};

/**
 * Get last message of a specific chat. Stored into each chat and updated every new message.
 */
FirebaseManager.prototype.getLastMessage = function (chatId) {
    var chatRef = this.getChatsRef();
    var p = new Promise(function (resolve, reject) {
        if (status === FirebaseManager.STATUS_CONNECTED) {
            chatRef.child(chatId).child('last_message').once('value', function(snapshot) {
                var result = snapshot.val();
                resolve(result);
            }, function (error) {
                if (error) {
                    reject('Cannot get latest message');
                }
            });
        } else {
            reject(500, error.FIREBASE_ERROR);
        }
    });
    return p;
};

/** Get list of chats in which an user is participating, except deleted.
 */
FirebaseManager.prototype.getChats = function (userId) {
        var userRef = this.getUsersRef();
        var chatRef = this.getChatsRef();
        var p = new Promise(function (resolve, reject) {
            if (status === FirebaseManager.STATUS_CONNECTED) {
                userRef.child(userId).child('chats').once('value', function (snapshot) {
                    var allPromises = new Array();
                    for (let chatId in snapshot.val()) {
                        let innerPromise = new Promise((resolve, reject) => {
                            chatRef.orderByKey().equalTo(chatId).once('value', function (snapshot) {
                                let result = snapshot.val();
                                //Filter deleted chats
                                let chatObj = result[chatId];
                                if (chatObj['deleted'] != 'true') {
                                    resolve(result);
                                } else {
                                    resolve();
                                }
                            });
                        });
                        allPromises.push(innerPromise);
                    }
                    Promise.all(allPromises).then(values => {
                        // Filter empty objects
                        if (typeof(values[0])!='undefined') {
                            resolve(values);
                        } else {
                            resolve([]);
                        }
                    }).catch(error => {
                        reject(errorHandler.INTERNAL_SERVER_ERROR);
                    });
                }), function (error) {
                    if (error) {
                        reject(errorHandler.NOT_FOUND);
                    }
                }
            } else {
                reject(errorHandler.INTERNAL_SERVER_ERROR);
            }
        });
        return p;
};

/**
 * Get users participating to a chat.
 * NOTE: Returned value only includes id of users. YOU HAVE TO get user info with another query.
 */
FirebaseManager.prototype.getChatUsers = function(chatId) {
    var chatRef = this.getChatsRef();
    var userRef = this.getUsersRef();
    var p = new Promise(function (resolve, reject) {
        if (status === FirebaseManager.STATUS_CONNECTED) {
            chatRef.child(chatId).child('users').once('value', function (snapshot) {
                var allPromises = new Array();
                let snap = snapshot.val();
                var result = [];
                for (var userKey in snap) {
                    result.push(snap[userKey]);
                }
                result.forEach(function (user) {
                    let innerPromise = new Promise((resolve, reject) => {
                        userRef.child(user.id).once('value', function (snapshot) {
                            var resultingObject = snapshot.val();
                            delete resultingObject['chats'];
                            resultingObject['role'] = user.role;
                            resolve(resultingObject);
                        }, function(error) {
                            reject(errorHandler.NOT_FOUND);
                        });
                    });
                    allPromises.push(innerPromise);
                });
                Promise.all(allPromises).then(values => {
                    resolve(values);
                }).catch(function(error) {
                    reject(errorHandler.INTERNAL_SERVER_ERROR);
                });
            }, function (error) {
                reject(errorHandler.NOT_FOUND);
            });
        } else {
            reject(errorHandler.INTERNAL_SERVER_ERROR);
        }
    });
    return p;
};

/**
 * Get user info (name and/or image).
 */
FirebaseManager.prototype.getUserInfo = function (userId) {
    var userRef = this.getUsersRef();
    var p = new Promise(function (resolve, reject) {
        if (status === FirebaseManager.STATUS_CONNECTED) {
            userRef.child(userId).once('value', function(snapshot) {
                resolve(snapshot.val());
            }, function (error) {
                if (error) {
                    reject();
                }
            });
        } else {
            reject(500, error.FIREBASE_ERROR);
        }
    });
    return p;
};

/**
 * Get chat info (name, image, type, last message).
 */
FirebaseManager.prototype.getChatInfo = function (chatId) {
    var chatRef = this.getChatsRef();
    var p = new Promise(function (resolve, reject) {
        if (status === FirebaseManager.STATUS_CONNECTED) {
            chatRef.child(chatId).once('value', function(snapshot) {
                resolve(snapshot.val());
            }, function (error) {
                if (error) {
                    reject(errorHandler.NOT_FOUND);
                }
            });
        } else {
            reject(errorHandler.INTERNAL_SERVER_ERROR);
        }
    });
    return p;
};

/**
 * Update chat parameters. Used to change details.
 */
FirebaseManager.prototype.updateChat = function(newChat) {
    var self = this;
    var chatRef = this.getChatsRef();
    var p = new Promise(function (resolve, reject) {
        if (status === FirebaseManager.STATUS_CONNECTED) {
            chatRef.child(newChat.id).update(newChat, function (error) {
                if (error) {
                    reject(errorHandler.INTERNAL_SERVER_ERROR);
                }
                let newMessage =
                    {
                        "chat_id": newChat.id,
                        "sender": "SYSTEM",
                        "text": notification.CHATUPDATED,
                        "type": "INFO"
                    };
                self.saveMessage(newMessage);
                resolve();
            })
        } else {
            reject(errorHandler.INTERNAL_SERVER_ERROR);
        }
    });
    return p;
};

/**
 * Update an user (name and/or image).
 * It updates only element inside user node.
 */
FirebaseManager.prototype.updateUser = function (user) {
    var userRef = this.getUsersRef();
    var p = new Promise(function (resolve, reject) {
        if (status === FirebaseManager.STATUS_CONNECTED) {
            userRef.child(user.id).update(user)
                .then(function() {
                    resolve(httpCode.OK);
                })
                .catch(function(error) {
                    reject(errorHandler.INTERNAL_SERVER_ERROR);
                });
        } else {
            reject(errorHandler.INTERNAL_SERVER_ERROR);
        }
    });
    return p;
};

/**
 * Delete chat, set a flag which marks it as deleted.
 * This method does not update users or message and it does not remove completely chat reference.
 */
FirebaseManager.prototype.deleteChat = function (chatId) {
        var chatRef = this.getChatsRef();
        var p = new Promise(function (resolve, reject) {
            if (status === FirebaseManager.STATUS_CONNECTED) {
                chatRef.child(chatId).update({"deleted": "true"}, function (error) {
                    if (error) {
                        reject(errorHandler.INTERNAL_SERVER_ERROR);
                    } else {
                        resolve();
                    }
                });
            } else {
                reject(errorHandler.INTERNAL_SERVER_ERROR);
            }
        });
        return p;
};

/**
 * Add a new user to chat. Create user under chat ref and insert that chat for each users involved.
 */
FirebaseManager.prototype.addUser = function (users, chatId) {
    var self = this;
    var chatRef = this.getChatsRef();
    var userRef = this.getUsersRef();
    var p = new Promise(function (resolve, reject) {
        if (status === FirebaseManager.STATUS_CONNECTED) {
            // Add user ref from chat
            var allPromises = new Array();
            users.forEach(function(id) {
                let innerPromise = new Promise((resolve, reject) => {
                    userRef.child(id).once('value', function(snapshot) {
                        let result = snapshot.val();
                        if (result) { // If user has been already created
                            // Check that user is not already participating to chat
                            chatRef.child(chatId).child("users").child(id).once('value', function(snapshot) {
                                if (snapshot.val() == null) { //not found
                                    let newUser = {};
                                    newUser[id] = {"id": id, "role": "USER"};
                                    chatRef.child(chatId).child("users").update(newUser, function(error) {
                                        // Add chat ref to every users added
                                        var newChat = {};
                                        newChat[chatId] = chatId;
                                        userRef.child(id).child("chats").update(newChat, function(error) {
                                            // Add message to chat history
                                            let newMessage =
                                                {
                                                    "chat_id": chatId,
                                                    "sender": "SYSTEM",
                                                    "text": notification.NEWUSERADDED,
                                                    "type": "INFO"
                                                };
                                            self.saveMessage(newMessage);
                                        });
                                    });
                                }
                                resolve();
                            }, function(error) {
                                reject(errorHandler.INTERNAL_SERVER_ERROR);
                            });
                        } else {
                            // Resolve promise passing empty users
                            resolve();
                        }
                    });
                });
                allPromises.push(innerPromise);
            });
            Promise.all(allPromises).then(values => {
                resolve(values);
            }).catch(function(error) {
                reject(errorHandler.INTERNAL_SERVER_ERROR);
            });
        } else {
            reject(errorHandler.INTERNAL_SERVER_ERROR);
        }
    });
    return p;
};

FirebaseManager.prototype.getUserRoleInChat = function(userId, chatId) {
    var chatRef = this.getChatsRef();
    var p = new Promise(function(resolve, reject) {
       if (status === FirebaseManager.STATUS_CONNECTED) {
           chatRef.child(chatId).child('users').child(userId).once('value', function(snapshot) {
               let result = snapshot.val();
               console.log(JSON.stringify(result));
               resolve(result['role']);
           }, function(error) {
               reject(errorHandler.INTERNAL_SERVER_ERROR);
           })
       } else {
           reject(errorHandler.INTERNAL_SERVER_ERROR);
       }
    });
    return p;
};

FirebaseManager.prototype.setUserRole = function(chatId, userId, newStatus) {
    var chatRef = this.getChatsRef();
    var p = new Promise(function(resolve, reject) {
        if (status === FirebaseManager.STATUS_CONNECTED) {
            let updatedStatus = {'id':userId, 'role': newStatus};
            chatRef.child(chatId).child('users').child(userId).update(updatedStatus, function(error) {
                if (error) {
                    reject(errorHandler.INTERNAL_SERVER_ERROR);
                } else {
                    resolve(updatedStatus);
                }
            });
        } else {
            reject(errorHandler.INTERNAL_SERVER_ERROR);
        }
    });
    return p;
};

/**
 * Remove specific user from a chat.
 * This cancels reference from both chat object and user object.
 */
FirebaseManager.prototype.removeUser = function (userId, chatId) {
    var self = this;
    var chatRef = this.getChatsRef();
    var userRef = this.getUsersRef();
    var p = new Promise(function (resolve, reject) {
        if (status === FirebaseManager.STATUS_CONNECTED) {
            // Remove user ref from chat
            chatRef.child(chatId).child("users").once('value', function(snapshot) {
                let snap = snapshot.val();
                var adminCounter = 0;
                var isAdmin = false;
                // Iterate over all users in that chat
                for (let i = 0; i < snap.length; i++) {
                    let user = snap[i];
                    if (user.role == 'ADMIN') {
                        adminCounter++;
                        if (user.id == userId) {
                            isAdmin = true;
                        }
                    }
                }
                // If current user is the only admin, don't let him leave.
                if (isAdmin && adminCounter == 1) {
                    logger.info('Unique admin cannot leave chat');
                    reject(errorHandler.NOT_ACCEPTABLE);
                } else {
                    // Remove
                    chatRef.child(chatId).child("users").child(userId).remove(function (error) {
                        if (error) {
                            logger.info('Cannot remove user from chat.');
                            reject(errorHandler.INTERNAL_SERVER_ERROR);
                        } else {
                            // Remove chat ref from user
                            userRef.child(userId).child("chats").child(chatId).remove(function (error) {
                                if (error) {
                                    logger.info('Cannot remove chat from user.');
                                    reject(errorHandler.INTERNAL_SERVER_ERROR);
                                } else {
                                    // Add message to chat history
                                    let newMessage =
                                        {
                                            "chat_id": chatId,
                                            "sender": "SYSTEM",
                                            "text": notification.USERREMOVED,
                                            "type": "INFO"
                                        };
                                    self.saveMessage(newMessage);
                                    resolve();
                                }
                            });
                        }
                     })
                }
            });
        } else {
            reject(errorHandler.INTERNAL_SERVER_ERROR);
        }
    });
    return p;
};

/* FIREBASE CONFIGURATION */
FirebaseManager.prototype.getError = function () {
    return error;
};
FirebaseManager.prototype.isConnected = function () {
    return status === FirebaseManager.STATUS_CONNECTED && !this.getError();
};
FirebaseManager.prototype.getFirebaseApp = function () {
    return firebaseApp;
};
var connectToFirebase = function () {
    // Build admin config
    firebaseConfig = buildFirebaseConfigOrThrow();
    firebaseApp = Firebase.initializeApp(firebaseConfig);
};
// Builds the firebase configuration from the environment variables listed in the README.md file
var buildFirebaseConfigOrThrow = function () {
    var missingParams = "";
    // Check missing params
    if (!serviceAccount) {
        missingParams += "serviceAccountFile ";
    }
    if (!serviceAccount.type) {
        missingParams += "type ";
    }
    if (!serviceAccount.project_id) {
        missingParams += "project_id ";
    }
    if (!serviceAccount.private_key_id) {
        missingParams += "private_key_id ";
    }
    if (!serviceAccount.private_key) {
        missingParams += "private_key ";
    }
    if (!serviceAccount.client_email) {
        missingParams += "client_email ";
    }
    if (!serviceAccount.client_id) {
        missingParams += "client_id ";
    }
    if (!serviceAccount.auth_uri) {
        missingParams += "auth_uri ";
    }
    if (!serviceAccount.token_uri) {
        missingParams += "token_uri ";
    }
    if (!serviceAccount.auth_provider_x509_cert_url) {
        missingParams += "auth_provider_x509_cert_url ";
    }
    if (!serviceAccount.client_x509_cert_url) {
        missingParams += "client_x509_cert_url ";
    }
    if (missingParams !== "") {
        // Something is missing! Throw new error
        throw new Error("Missing " + missingParams + "for firebase config, check the environment variables");
    } else {
        // No missing params, return the firebase configuration
        return {
            credential: Firebase.credential.cert(serviceAccount),
            databaseURL: "https://" + serviceAccount.project_id + ".firebaseio.com",
            databaseAuthVariableOverride: {
                uid: "chat-service"
            }
        };
    }
};

/* FIREBASE ROOT REFERENCE */
FirebaseManager.prototype.getChatsRef = function () {
    return this.getFirebaseApp().database().ref("/chats/");
};
FirebaseManager.prototype.getMessagesRef = function () {
    return this.getFirebaseApp().database().ref("/messages/");
};
FirebaseManager.prototype.getUsersRef = function () {
    return this.getFirebaseApp().database().ref("/users/");
};

/* FIREBASE STATES */
FirebaseManager.STATUS_NOT_CONNECTED = 0;
FirebaseManager.STATUS_CONNECTED = 1;
FirebaseManager.STATUS_ERROR = -1;

/* FIREBASE MANAGER */
var FBManager = new FirebaseManager();
if (!FBManager.isConnected()) {
    logger.info(FBManager.getError().message);
} else {
    logger.info("Firebase connection: " + FBManager.isConnected())
}

module.exports = FBManager;