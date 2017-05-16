// Main application script
//const chatRouter = require('./routes');
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('winston');
const app = express();
const promise = require('promise');
const FirebaseManager = require('./managers/firebase-manager');


// Get all environment constants
/*var projectName = process.env.MM_PROJECT_NAME;
var chatDBUrl = process.env.MM_CHAT_DB_URL;
var chatDBUsername = process.env.MM_CHAT_DB_USERNAME;
var chatDBPassword = process.env.MM_CHAT_DB_PASSWORD;
var chatServerPort = process.env.MM_CHAT_SERVER_PORT;
var development = process.env.MM_CHAT_DEVELOPMENT;*/

/* FIREBASE MANAGER */
var myFirebaseManager = new FirebaseManager();
if (!myFirebaseManager.isConnected()) {
    logger.info(myFirebaseManager.getError().message);
} else {
    logger.info("Firebase connection: " + myFirebaseManager.isConnected())
}

/* ROUTING AND LOGGING */
app.use(bodyParser.json());
app.listen(3000, function () {
  logger.info('Listening on port 3000...');
});

//API
// Sample page
app.get('/', function(req, res) {
  res.send('Ciao! Benvenuto nel modulo di chat!');
});

// Chat creation (single or group)
app.post('/api/chat', function(req, res) {
    //TODO: validate chat json
    myFirebaseManager.createChat(req.body)
        .then(function () {
            res.status(201).send('201');
        })
        .catch(function () {
            res.status(400).send('400');
        });
});

// modifica parametri chat 1-1 e 1-N - Qui verranno modificate tutte le opzioni della chat, ovvero l'aggiunta/rimozione di partecipanti*/
app.put('/api/chat/:chatid', function(req,res) {

});

// Invio nuovo messaggio
app.post('/api/chat/:chatid/message', function(req,res) {
    myFirebaseManager.saveMessage(req.body)
        .then(function(statusCode) {
            res.status(200).send(req.body);
        })
        .catch(function(errorCode){
            res.sendStatus(errorCode);
    });
    // Get token from LOGIN module, passing all participants in chat :chatid
    myFirebaseManager.sendMessage(["registration_token_1"], "Test", "This is the body of the notification", {custom: "This is a custom field!"})
        .then(function (response) {
            logger.info('sent');
        })
        .catch(function (error) {
            logger.info('not sent');
        });
});

// Abbandono di una chat da parte dell'utente
app.put('/api/chat/:chatid/:userid/leave', function(req,res) {
    myFirebaseManager.removeUser(req.params.userid, req.params.chatid)
        .then(function () {
            res.status(201).send('201');
        })
        .catch(function () {
            res.status(404).send('404');
        });
});

// Get chat list of current user
app.get('/api/chat/all/user/:userid', function(req,res) {
    console.log(req.params.userid);
    myFirebaseManager.getChats(req.params.userid)
        .then(function (chats) {
            res.status(201).send(chats);
        })
        .catch(function () {
            res.status(404).send('404');
        });
});

// Get list of messages of a chat
app.get('/api/chat/:chatid', function(req,res) {
    myFirebaseManager.getAllMessages(req.params.chatid)
        .then(function (messages) {
            res.status(201).send(messages);
        })
        .catch(function () {
            res.status(404).send('404');;
        });
});

// Delete chat
app.delete('/api/chat/:chatid', function (req,res) {
    myFirebaseManager.deleteChat(req.params.chatid)
        .then(function () {
            res.status(201).send('201');
        })
        .catch(function () {
            res.status(404).send('404');
        });
});