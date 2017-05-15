const Firebase = require('firebase-admin');
const Promise = require('promise');

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

function throwError() {
    var error = this.getError();
    if (error) {
        throw error;
    } else {
        throw this.error
    }
}

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
            break;

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
FirebaseManager.prototype.sendMessage = function (tokens,
                                                  notificationTitle, notificationBody, customData) {

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
 * Create a new chat.
 * @param newChat
 * @returns {*|Promise}
 */
FirebaseManager.prototype.createChat = function (newChat) {
    if (status === FirebaseManager.STATUS_CONNECTED) {
        var chatRef = this.getChatsRef();
        var p = new Promise(function (resolve, reject) {
            chatRef.child(newChat.id).set(newChat, function(error) {
                if (error) {
                    reject();
                } else {
                    resolve();
                }
            })
        });
        return p;
    } else {
        throwError.call(this)
    }
};



/**
 * Get all messages of a specific chat.
 * @param chatId
 * @returns {*|Promise}
 */
FirebaseManager.prototype.getAllMessages = function (chatId) {
    if (status === FirebaseManager.STATUS_CONNECTED) {
        var messageRef = this.getMessagesRef();

        var p = new Promise(function (resolve, reject) {
            messageRef.orderByChild('chat_id').equalTo(chatId).once('value', function(snapshot) {
               resolve(snapshot.val());
            }), function(error) {
                reject();
            }
        });
        return p;
    } else {
        throwError.call(this);
    }
};

/** Get list of chats in which an user is participating.
  * @param userId
 * @returns {*|Promise}
 */
FirebaseManager.prototype.getChats = function (userId) {
    if (status === FirebaseManager.STATUS_CONNECTED) {
        var userRef = this.getUsersRef();
        var p = new Promise(function (resolve, reject) {
            userRef.child(userId).child('chats').once('value', function(snapshot) {
                resolve(snapshot.val());
            }), function(error) {
                reject();
            }
        });
        return p;
    } else {
        throwError.call(this);
    }
};

/**
 * Update chat parameters. Used to add new members to the chat, plus to change detail info.
 * @param chatId
 * @returns {*|Promise}
 */
FirebaseManager.prototype.updateChat = function(chatId) {
    if (status === FirebaseManager.STATUS_CONNECTED) {
        var chatRef = this.getChatsRef();
        var p = new Promise(function (resolve, reject) {
            chatRef.child(newChat.id).set(newChat, function(error) {
                if (error) {
                    reject();
                } else {
                    resolve();
                }
            })
        });
        return p;
    } else {
        throwError.call(this);
    }
};

/**
 * Post a new message to a specific chat.
 * Update chat with latest message.
 * @param newMessage
 * @returns {*|Promise}
 */
FirebaseManager.prototype.saveMessage = function (newMessage) {
    if (status === FirebaseManager.STATUS_CONNECTED) {
        var messageRef = this.getMessagesRef();
        var p = new Promise(function(resolve, reject) {
            // NOTE: Here I am creating a new node and putting a value inside it
            messageRef.push(newMessage, function (error) {
                if (error) {
                    reject(404);
                } else {
                    resolve(200);
                }
            });
        });
        // Update chat with latest message
        var lastMessage = {"last_message": newMessage};
        var chatRef = this.getChatsRef();
        chatRef.child(newMessage.chat_id).update(lastMessage, function(error) {
            if (error) {
                logger.info('Chat last message not updated!');
            }
        });
        var userRef = this.getUsersRef();
        userRef.child(newMessage.chat_id).child('last_message').once('value', function(error) {
            if (error) {
                logger.info('Chat last message not updated!');
            }
        });
        return p;
    } else {
        throwError.call(this);
    }
};

/**
 * Get last message of a specific chat. Stored into each chat and updated every new message.
 * @param chatId
 * @returns {*|Promise}
 */
FirebaseManager.prototype.getLastMessage = function (chatId) {
    if (status === FirebaseManager.STATUS_CONNECTED) {
        var messageRef = this.getMessagesRef();
        var p = new Promise(function (resolve, reject) {
            chatRef.child(newChat.id).set(newChat, function(error) {
                if (error) {
                    reject();
                } else {
                    resolve();
                }
            })
        });
        return p;
    } else {
        throwError.call(this);
    }
};

/**
 * Delete chat, set a flag which marks it as deleted
 * @param chatId
 * @returns {*|Promise}
 */
FirebaseManager.prototype.deleteChat = function (chatId) {
    if (status === FirebaseManager.STATUS_CONNECTED) {
        var chatRef = this.getChatsRef();
        var p = new Promise(function (resolve, reject) {
            chatRef.child(chatId).update({"deleted":"true"}, function(error) {
                if (error) {
                    reject();
                } else {
                    resolve();
                }
            })
        });
        return p;
    } else {
        throwError.call(this);
    }
};

FirebaseManager.prototype.removeUser = function (userId, chatId) {
    if (status === FirebaseManager.STATUS_CONNECTED) {
        var chatRef = this.getChatsRef();
        var userRef = this.getUsersRef();
        var p = new Promise(function (resolve, reject) {
            chatRef.child(chatId).child("users").child(userId).remove(function(error) {
                if (error) {
                    reject();
                } else {
                    userRef.child(userId).child("chats").child(chatId).remove(function(error) {
                        if (error) {
                            reject();
                        } else {
                            resolve();
                        }
                    });
                }
            })
        });
        return p;
    } else {
        throwError.call(this);
    }
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


module.exports = FirebaseManager;