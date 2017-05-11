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


//API CALL

/*POST /api/chat
creazione chat 1-1 e 1-N*/

/*PUT /api/chat/{chat-id}
modifica parametri chat 1-1 e 1-N - Qui verranno modificate tutte le opzioni della chat, ovvero l'aggiunta/rimozione di partecipanti*/

/*POST /api/chat/{chat-id}/message
invio messaggio*/

/*PUT /api/chat/{chat-id}/leave
abbandono di una chat da parte dell'utente corrente*/

/*DELETE /api/chat/{chat-id}
cancellazione di una chat e forzatura dell'abbandono della stessa per tutti i suoi partecipanti*/

/*GET /api/chat/mine/
elenco di tutte le chat a cui appartiene l'utente corrente*/

/*GET /api/chat/{chat-id}
elenco di tutti i messaggi di una chat*/


myFirebaseManager.createChat(1)
    .then(function () {
        console.log("Created!");
    })
    .catch(function (error) {
        console.log(error);
    });

// PRIVATE FUNCTIONS

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

Chat.GROUP = 1;
Chat.SINGLE = 0;