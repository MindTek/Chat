const Firebase = require('firebase-admin');
const Promise = require('promise');
const {logger} = require('../helpers/init');
const serviceAccount = require('./../config/serviceAccountKey.json');
const {notification_title, errorHandler, httpCode} = require('../helpers/enum');


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

/**
 * @returns The already generated firebase config, may be undefined if FirebaseManager.prototype.buildFirebaseConfigOrThrow
 * has not been called or has thrown an exception. (It's called by default in the constructor)
 */
FirebaseManager.prototype.getFirebaseConfig = function () {
    return firebaseConfig;
};

/* NOTIFICATIONS */
/**
 * Send push notifications to all the given tokens with the given payload
 * @param tokens The tokens (array of strings or a single string) of the device to send the notification to
 * @param payload The content of the notification
 *        (https://firebase.google.com/docs/cloud-messaging/admin/send-messages#define_the_message_payload)
 */
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

/**
 * Send push notifications to all the given tokens with the given params
 * @param tokens The tokens (array of strings or a single string) of the device to send the notification to
 * @param notificationTitle The notification title
 * @param notificationBody The notification message
 * @param customData The custom data
 */
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
 */
FirebaseManager.prototype.createChat = function (newChat) {
    var chatRef = this.getChatsRef();
    var p = new Promise(function (resolve, reject) {
        if (status === FirebaseManager.STATUS_CONNECTED) {
            var newChatRef = chatRef.push(newChat, function (error) {
                if (error) {
                    reject(error);
                }
            });
            var chatId = newChatRef.key;
            resolve(chatId);
        } else {
            reject(500, error.FIREBASE_ERROR);
        }
    });
    return p;
};

/**
 * Create a new user entry inside users node.
 * @param newUser
 * @returns {Promise}
 */
FirebaseManager.prototype.createUser = function (newUser) {
    var userRef = this.getUsersRef();
    var p = new Promise(function (resolve, reject) {
        if (status === FirebaseManager.STATUS_CONNECTED) {
            userRef.child(newUser.id).set(newUser, function (error) {
                if (error) {
                    reject(errorHandler.INTERNAL_SERVER_ERROR);
                } else {
                    resolve();
                }
            })
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
            logger('Chat last message not updated!');
        }
    });
    return p;
};


/**
 * Get all messages of a specific chat.
 * @param chatId
 * @returns {Promise [messages]}
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
                    reject();
                }
            }
        } else {
            reject(500, error.FIREBASE_ERROR);
        }
    });
    return p;
};

/**
 * Get last message of a specific chat. Stored into each chat and updated every new message.
 * @param chatId
 * @returns {Promise}
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
 * @param userId
 * @returns {Promise [chats]}
 */
FirebaseManager.prototype.getChats = function (userId) {
        var userRef = this.getUsersRef();
        var chatRef = this.getChatsRef();
        var p = new Promise(function (resolve, reject) {
            if (status === FirebaseManager.STATUS_CONNECTED) {
                userRef.child(userId).child('chats').once('value', function (snapshot) {
                    var allPromises = new Array();
                    for (var chatId in snapshot.val()) {
                        var innerPromise = new Promise((resolve, reject) => {
                            chatRef.orderByKey().equalTo(chatId).once('value', function (snapshot) {
                                let result = snapshot.val();
                                //Filter deleted chats
                                if (result[chatId]['deleted'] != 'true') {
                                    resolve(snapshot.val());
                                } else {
                                    resolve();
                                }
                            });
                        });
                        allPromises.push(innerPromise);
                    }
                    Promise.all(allPromises).then(values => {
                        if (typeof(values[0])!='undefined') {
                            logger(values);
                            resolve(values);
                        } else {
                            resolve([]);
                        }
                    });
                }), function (error) {
                    if (error) {
                        reject();
                    }
                }
            } else {
                reject(500, error.FIREBASE_ERROR);
            }
        });
        return p;
};

// NO MORE WORKING
/**
 * Get users which are participating to a chat.
 * NOTE: Returned value only includes id of users. YOU HAVE TO get user info with another query.
 * @param chatId
 * @returns {Promise [users_id]}
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
                /*snap.forEach(function(item) {
                    result.push(item);
                });*/
                result.forEach(function (user) {
                    var innerPromise = new Promise((resolve, reject) => {
                        userRef.child(user.id).once('value', function (snapshot) {
                            var resultingObject = snapshot.val();
                            delete resultingObject['chats'];
                            resultingObject['role'] = user.role;
                            resolve(resultingObject);
                            logger.info("TEST2: " + JSON.stringify(resultingObject));
                        }, function(error) {
                            logger.info(error);
                            reject();
                        });
                    });
                    allPromises.push(innerPromise);
                });
                logger.info('waiting...');
                Promise.all(allPromises).then(values => {
                    logger.info('All promises resolved!');
                    resolve(values);
                }).catch(function(error) {
                    logger.info(error);
                });
            }, function (error) {
                reject('Not found users on chat.');
            });
        } else {
            reject(500, error.FIREBASE_ERROR);
        }
    });
    return p;
};

/**
 * Get user info (name and/or image).
 * @param userId
 * @returns {Promise}
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
 * Update chat parameters. Used to change details.
 */
FirebaseManager.prototype.updateChat = function(newChat) {
    var chatRef = this.getChatsRef();
    var p = new Promise(function (resolve, reject) {
        if (status === FirebaseManager.STATUS_CONNECTED) {
            chatRef.child(newChat.id).update(newChat, function (error) {
                if (error) {
                    reject(errorHandler.INTERNAL_SERVER_ERROR);
                }
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
            userRef.child(user.id).update(user, function (error) {
                if (error) {
                    reject(errorHandler.INTERNAL_SERVER_ERROR);
                } else {
                    resolve();
                }
            })
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
 * UPDATE THIS COMMENT

 */
FirebaseManager.prototype.addUser = function (users, chatId) {
    var chatRef = this.getChatsRef();
    var userRef = this.getUsersRef();
    var p = new Promise(function (resolve, reject) {
        if (status === FirebaseManager.STATUS_CONNECTED) {
            // Add user ref from chat
            users.forEach(function(id) {
                var newUser = {"id": id, "role": "USER"};
                logger.info(newUser);
                chatRef.child(chatId).child("users").push(newUser, function(error) {
                    if (error) {
                        reject("Cannot add user to chat.");
                    } else {
                        // Add chat ref to every users added
                        var newChat = {};
                        newChat[chatId] = chatId;
                        userRef.child(id).child("chats").update(newChat, function(error) {
                            if (error) {
                                reject("Cannot add chat to user.");
                            } else {
                                resolve();
                            }
                        });
                    }
                });
            });
        } else {
            reject(500, error.FIREBASE_ERROR);
        }
    });
    return p;
};

/**
 * Remove specific user from a chat.
 * This cancel reference from both chat object and user object.
 */
FirebaseManager.prototype.removeUser = function (userId, chatId) {
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
                    if (user.id == userId) {
                        var userIndex = i;
                    }
                }
                // If current user is the only admin, don't let him leave.
                if (isAdmin && adminCounter == 1) {
                    logger.info('Unique admin cannot leave chat');
                    reject(errorHandler.NOT_ACCEPTABLE);
                } else {
                    // Remove
                    chatRef.child(chatId).child("users").child(userIndex).remove(function (error) {
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

// FIREBASE MANAGEMENT
/**
 * Get the last generated error
 * @returns The last generated error
 */
FirebaseManager.prototype.getError = function () {
    return error;
};

/**
 * @returns {boolean} the manager is connected correctly to firebase and no error has occurred
 */
FirebaseManager.prototype.isConnected = function () {
    return status === FirebaseManager.STATUS_CONNECTED && !this.getError();
};

/**
 * @returns The firebase app, use this to do manually firebase options, be careful
 */
FirebaseManager.prototype.getFirebaseApp = function () {
    return firebaseApp;
};

/**
 * This is a utility method that returns the messages root reference
 * @returns {*|admin.database.Reference}
 */
FirebaseManager.prototype.getChatsRef = function () {
    return this.getFirebaseApp().database().ref("/chats/");
};

/**
 * This is a utility method that returns the messages root reference
 * @returns {*|admin.database.Reference}
 */
FirebaseManager.prototype.getMessagesRef = function () {
    return this.getFirebaseApp().database().ref("/messages/");
};

/**
 * This is a utility method that returns the messages root reference
 * @returns {*|admin.database.Reference}
 */
FirebaseManager.prototype.getUsersRef = function () {
    return this.getFirebaseApp().database().ref("/users/");
};

/**
 * This method builds a configuration and initialize the firebase application
 * @throws An error if some required firebase credentials are missing
 */
var connectToFirebase = function () {
    // Build admin config
    firebaseConfig = buildFirebaseConfigOrThrow();
    firebaseApp = Firebase.initializeApp(firebaseConfig);
};

/**
 * This method build the firebase configuration from the environment variables listed in the README.md file
 * @returns generated firebase configuration
 * @throws An error if some required firebase credentials are missing
 */
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


/**
 * This is a state representing that this manager instance has not been connected to firebase yet (Constructor)
 * @type {number}
 */
FirebaseManager.STATUS_NOT_CONNECTED = 0;
/**
 * This is a state representing that this manager instance is correctly connected to firebase
 * @type {number}
 */
FirebaseManager.STATUS_CONNECTED = 1;
/**
 * This is a state representing that this manager instance has encountered an error connecting to firebase
 * @type {number}
 */
FirebaseManager.STATUS_ERROR = -1;

/* FIREBASE MANAGER */
var FBManager = new FirebaseManager();
if (!FBManager.isConnected()) {
    logger.info(FBManager.getError().message);
} else {
    logger.info("Firebase connection: " + FBManager.isConnected())
}

module.exports = FBManager;