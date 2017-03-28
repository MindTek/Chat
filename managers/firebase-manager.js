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
        //connectToFirebaseDB();
        status = FirebaseManager.STATUS_CONNECTED;
    } catch (err) {

        error = err;
        status = FirebaseManager.STATUS_ERROR;
    }
};


// @@@@@ Exposed functions @@@@@
/**
 * Send push notifications to all the given tokens with the given payload
 * @param tokens The tokens (array of strings or a single string) of the device to send the notification to
 * @param payload The content of the notification
 *        (https://firebase.google.com/docs/cloud-messaging/admin/send-messages#define_the_message_payload)
 * @return {Promise<admin.messaging.MessagingDevicesResponse>}
 */
FirebaseManager.prototype.sendMessage = function (tokens, payload) {
    return this.getFirebaseApp().messaging().sendToDevice(tokens, payload);
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

    return this.getFirebaseApp().messaging().sendToDevice(tokens, {
        notification: {
            title: notificationTitle,
            body: notificationBody
        },
        data: customData
    });
};

/**
 *
 * @param newMessage The new message to be pushed inside the firebaseDB
 * @return Promise<void>
 */
FirebaseManager.prototype.saveChatMessage = function (newMessage) {

    var messagesRef = this.getMessagesRef();
    var chatRef = messagesRef.child(newMessage.chat_id);
    return chatRef.push(newMessage);
};

/**
 * @returns The already generated firebase config, may be undefined if FirebaseManager.prototype.buildFirebaseConfigOrThrow
 * has not been called or has thrown an exception. (It's called by default in the constructor)
 */
FirebaseManager.prototype.getFirebaseConfig = function () {
    return firebaseConfig;
};

/**
 * @returns Promise<any> saved chats and messages
 */
FirebaseManager.prototype.getAllMessages = function () {

    var messageRef = this.getMessagesRef();

    // Create a new promise and return directly the values and not the firebase object
    return new Promise(function (fulfill, reject) {

        messageRef.once("value")
            .then(function (snapshot) {
                fulfill(Object.values(snapshot.val()));
            })
            .catch(function (error) {
                reject(error);
            });
    });
};

/**
 * @param chatId The chat to search the messages for
 * @returns All the messages for the chat
 */
FirebaseManager.prototype.getAllMessagesForChat = function (chatId) {

    var messageRef = this.getMessagesRef();

    return new Promise(function (fulfill, reject) {

        messageRef.child(chatId).once("value")
            .then(function (snapshot) {
                fulfill(Object.values(snapshot.val()));
            })
            .catch(function (error) {
                reject(error);
            });
    });
};

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
FirebaseManager.prototype.getMessagesRef = function () {
    return this.getFirebaseApp().database().ref("server/chat/messages");
};


// @@@@@ Internal functions @@@@@
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
            databaseURL: "https://" + serviceAccount.project_id + ".firebaseio.com"
        };
    }
};


// @@@@@ Exposed static variables
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