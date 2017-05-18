const Firebase = require('firebase-admin');
const Promise = require('promise');
const logger = require('winston');

var serviceAccount = require('./../config/serviceAccountKey.json');

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
        error = err;
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
 * @return {Promise<admin.messaging.MessagingDevicesResponse>}
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
 * @return {Promise.<admin.messaging.MessagingDevicesResponse>}
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
 * @param newChat
 * @returns {Promise}
 */
FirebaseManager.prototype.createChat = function (newChat) {
    var chatRef = this.getChatsRef();
    var p = new Promise(function (resolve, reject) {
        if (status === FirebaseManager.STATUS_CONNECTED) {
            chatRef.child(newChat.id).set(newChat, function (error) {
                if (error) {
                    reject();
                } else {
                    resolve();
                }
            })
        } else {
            reject();
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
                    reject();
                } else {
                    resolve();
                }
            })
        } else {
            reject();
        }
    });
    return p;
};

/**
 * Post a new message to a specific chat.
 * It creates a new entry inside message node.
 * Update chat with latest message.
 * @param newMessage
 * @returns {Promise}
 */
FirebaseManager.prototype.saveMessage = function (newMessage) {
    var messageRef = this.getMessagesRef();
    var p = new Promise(function(resolve, reject) {
        if (status === FirebaseManager.STATUS_CONNECTED) {
            messageRef.push(newMessage, function (error) {
                if (error) {
                    reject();
                } else {
                    resolve();
                }
            });
        } else {
            reject();
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
            reject();
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
    var messageRef = this.getMessagesRef();
    var p = new Promise(function (resolve, reject) {
        if (status === FirebaseManager.STATUS_CONNECTED) {
            chatRef.child(newChat.id).child('last_message').once('value', function(snapshot) {
                var messages = new Array();
                var result = snapshot.val();
                // Build array for client
                for (var mess in result) {
                    messages.push(result[mess]);
                }
                resolve(messages);
            }, function (error) {
                if (error) {
                    reject();
                }
            });
        } else {
            reject();
        }
    });
    return p;
};

/** Get list of chats in which an user is participating.
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
                                resolve(snapshot.val());
                            });
                        });
                        allPromises.push(innerPromise);
                    }
                    Promise.all(allPromises).then(values => {
                        resolve(values);
                    });
                }), function (error) {
                    if (error) {
                        reject();
                    }
                }
            } else {
                reject();
            }
        });
        return p;
};

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
            console.log(chatId);
            chatRef.child(chatId).child('users').once('value', function (snapshot) {
                let allPromises = new Array();
                let result = snapshot.val();
                for (var userId in result) {
                    var innerPromise = new Promise((resolve, reject) => {
                        userRef.child(userId).once('value', function (snapshot) {
                            var resultingObject = snapshot.val();
                            var userRole = result[userId].role;
                            delete resultingObject['chats'];
                            resultingObject['role'] = userRole;
                            console.log(resultingObject);
                            resolve(resultingObject);
                        });
                    });
                    allPromises.push(innerPromise);
                }
                Promise.all(allPromises).then(values => {
                    resolve(values);
                });
            }), function (error) {
                reject();
            }
        } else {
            reject();
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
            reject();
        }
    });
    return p;
};

/**
 * Get chat info (name, image, type, last message).
 * @param userId
 * @returns {Promise}
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
            reject();
        }
    });
    return p;
};

/**
 * Update chat parameters. Used to add new members to the chat, plus to change detail info.
 * @param chatId
 * @returns {Promise}
 */
FirebaseManager.prototype.updateChat = function(newChat) {
        var chatRef = this.getChatsRef();
        var userRef = this.getUsersRef();
        var p = new Promise(function (resolve, reject) {
            if (status === FirebaseManager.STATUS_CONNECTED) {
                chatRef.child(newChat.id).set(newChat, function (error) {
                    if (error) {
                        reject();
                    } else {
                        resolve();
                        console.log('I am continuing..');
                        console.log(newChat.id);
                        /*newChat.users.forEach((currentUser) => {
                            var chatToInsert = {[newChat.id : newChat.id};
                            userRef.child(currentUser.id).child('chats').set(newChat);
                        });*/
                    }
                })
            } else {
                reject();
            }
        });
        return p;
};

/**
 * Update an user (name and/or image).
 * It updates only element inside user node.
 * @param user
 * @returns {Promise}
 */
FirebaseManager.prototype.updateUser = function (user) {
    var userRef = this.getUsersRef();
    var p = new Promise(function (resolve, reject) {
        if (status === FirebaseManager.STATUS_CONNECTED) {
            userRef.child(user.id).update(user, function (error) {
                if (error) {
                    reject();
                } else {
                    resolve();
                }
            })
        } else {
            reject();
        }
    });
    return p;
};

/**
 * Delete chat, set a flag which marks it as deleted.
 * @param chatId
 * @returns {Promise}
 */
FirebaseManager.prototype.deleteChat = function (chatId) {
        var chatRef = this.getChatsRef();
        var userRef = this.getUsersRef();
        var p = new Promise(function (resolve, reject) {
            if (status === FirebaseManager.STATUS_CONNECTED) {
                chatRef.child(chatId).update({"deleted": "true"}, function (error) {
                    if (error) {
                        reject();
                    } else {
                        resolve();
                    }
                });
            } else {
                reject();
            }
        });
        return p;
};

/**
 * Remove specific user from a chat.
 * @param userId
 * @param chatId
 * @returns {Promise}
 */
FirebaseManager.prototype.removeUser = function (userId, chatId) {
        var chatRef = this.getChatsRef();
        var userRef = this.getUsersRef();
        var p = new Promise(function (resolve, reject) {
            if (status === FirebaseManager.STATUS_CONNECTED) {
                chatRef.child(chatId).child("users").child(userId).remove(function (error) {
                    if (error) {
                        reject();
                    } else {
                        userRef.child(userId).child("chats").child(chatId).remove(function (error) {
                            if (error) {
                                reject();
                            } else {
                                resolve();
                            }
                        });
                    }
                })
            } else {
                reject();
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