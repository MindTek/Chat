// Main application script
//const chatRouter = require('./routes');
const express = require('express'), bodyParser = require('body-parser');
const logger = require('winston');
const app = express();
const promise = require('promise');

// Get all environment constants
/*var projectName = process.env.MM_PROJECT_NAME;
var chatDBUrl = process.env.MM_CHAT_DB_URL;
var chatDBUsername = process.env.MM_CHAT_DB_USERNAME;
var chatDBPassword = process.env.MM_CHAT_DB_PASSWORD;
var chatServerPort = process.env.MM_CHAT_SERVER_PORT;
var development = process.env.MM_CHAT_DEVELOPMENT;*/

/* ROUTING AND LOGGING */
app.use(bodyParser.json());

app.listen(3000, function () {
  logger.info('Listening on port 3000...');
});

//API
// Sample page
app.get('/', function(req, res) {
  res.send('Ciao Matteo! Benvenuto nel modulo di chat!');
});

// Chat creation (single or group)
app.post('/api/chat', function(req, res) {
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
});

// Abbandono di una chat da parte dell'utente corrente
app.put('/api/chat/:id/:userid/leave', function(req,res) {

});

// Get chat list of current user
app.get('/api/chat/all/user/:userid', function(req,res) {

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


//FIREBASE MANAGER
const FirebaseManager = require('./managers/firebase-manager');
var myFirebaseManager = new FirebaseManager();

if (!myFirebaseManager.isConnected()) {
    logger.info(myFirebaseManager.getError().message);
} else {
    logger.info("Firebase connection: " + myFirebaseManager.isConnected())
}





/*myFirebaseManager.sendMessage([
        "eqjzyaNz-RQ:APA91bHTSSs17dwYy9iJSuPY-36LQn_9CouUvujcGn2MZ6txhkDZ8bSpiU7HgF5tyuuLa3z_MRKJtCpCm4aav4lm09oEO4zRwkR6h221h6lTXcrL8JDcoSBDRiZTlYPbymlBgpvoVTdm"],
    "Test", "This is the body of the notification", {
        custom: "This is a custom field!"
    })
    .then(function (response) {

    logger.info(require('util').inspect(response, false, null));
    })
    .catch(function (error) {
    logger.info(error);
    });*/








function getAllMessagesForChat(chatId) {
    myFirebaseManager.getAllMessagesForChat(chatId)
        .then(function(messages) {
            logger.debug(messages);
        })
        .catch(function(error){
            logger.debug(error);
        });
}

function getLastMessagesForChat(chatId) {
    myFirebaseManager.getLastMessagesForChat(chatId)
        .then(function(messages) {
            logger.debug("HERE" + messages);
            for (var i = 0, len = messages.length; i < len; i++) {
                logger.debug(messages[i].valueOf());
                logger.debug("\n");
            }
        })
        .catch(function(error){
            logger.debug(error);
        });
}