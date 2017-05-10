// Main application script
const chatRouter = require('./routes');
const express = require('express');
const app = express();
const promise = require('promise');

// Get all environment constants
/*var projectName = process.env.MM_PROJECT_NAME;
var chatDBUrl = process.env.MM_CHAT_DB_URL;
var chatDBUsername = process.env.MM_CHAT_DB_USERNAME;
var chatDBPassword = process.env.MM_CHAT_DB_PASSWORD;

var chatServerPort = process.env.MM_CHAT_SERVER_PORT;

var development = process.env.MM_CHAT_DEVELOPMENT;*/

app.use(chatRouter);

app.use(function (err, req, res, next) {

    console.log("An error has occurred");

    res.status(err.status || 500);
    res.send({
        error_msg: err.message || ("An error has occurred!\n" + err)
    });
});

/*
 var server = app.listen(chatServerPort || 3000, function () {
 console.log("Express server listening on port", server.address().port);
 });
 */

const FirebaseManager = require('./managers/firebase-manager');
var myFirebaseManager = new FirebaseManager();

if (!myFirebaseManager.isConnected()) {
    console.log(myFirebaseManager.getError().message);
} else {
    console.log("Firebase connection: " + myFirebaseManager.isConnected())
}


/*myFirebaseManager.sendMessage([
        "eqjzyaNz-RQ:APA91bHTSSs17dwYy9iJSuPY-36LQn_9CouUvujcGn2MZ6txhkDZ8bSpiU7HgF5tyuuLa3z_MRKJtCpCm4aav4lm09oEO4zRwkR6h221h6lTXcrL8JDcoSBDRiZTlYPbymlBgpvoVTdm"],
    "Test", "This is the body of the notification", {
        custom: "This is a custom field!"
    })
    .then(function (response) {

        console.log(require('util').inspect(response, false, null));
    })
    .catch(function (error) {
        console.log(error);
    });*/


// EXAMPLE OF FIREBASE MESSAGE STORING
myFirebaseManager.saveChatMessage({
    _id: "messageid4",
    text: "Message! " + Math.random(),
    user_id: "userId0",
    chat_id: "chatid1",
    timestamp: "" + new Date()
})
    .then(function () {
        console.log("Saved!");
        var res = getLastMessagesForChat("chatid1");
    })
    .catch(function (error) {
        console.log(error);
    });

function getMessages() {
    myFirebaseManager.getAllMessages()
    .then(function (messages) {
        console.log(messages);
    })
    .catch(function (error) {
        console.log(error);
    });
}

function getAllMessagesForChat(chatId) {
    myFirebaseManager.getAllMessagesForChat(chatId)
        .then(function(messages) {
            console.log(messages);
        })
        .catch(function(error){
            console.log(error);
        });
}

function getLastMessagesForChat(chatId) {
    myFirebaseManager.getLastMessagesForChat(chatId)
        .then(function(messages) {
            console.log("HERE" + messages);
            for (var i = 0, len = messages.length; i < len; i++) {
                console.log(messages[i].valueOf());
                console.log("\n");
            }
        })
        .catch(function(error){
            console.log(error);
        });
}