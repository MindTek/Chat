// Main application script
//const chatRouter = require('./routes');
const express = require('express'), bodyParser = require('body-parser');
const app = express();
const promise = require('promise');

// Get all environment constants
/*var projectName = process.env.MM_PROJECT_NAME;
var chatDBUrl = process.env.MM_CHAT_DB_URL;
var chatDBUsername = process.env.MM_CHAT_DB_USERNAME;
var chatDBPassword = process.env.MM_CHAT_DB_PASSWORD;
var chatServerPort = process.env.MM_CHAT_SERVER_PORT;
var development = process.env.MM_CHAT_DEVELOPMENT;*/

// LOAD ROUTING
app.use(bodyParser.json());
//app.use(chatRouter);

app.listen(3000, function () {
  console.log('Listening on port 3000...');
});

//API
// Sample page
app.get('/', function(req, res) {
  res.send('Ciao Matteo! Benvenuto nel modulo di chat!');
});

// Chat creation (single or group)
app.post('/api/chat', function(req, res) {
    createChat(req.body)
        .then(function(){
            res.status(201).send('201');
        })
        .catch(function(){
            res.status(400).send('400');
        });
});

// modifica parametri chat 1-1 e 1-N - Qui verranno modificate tutte le opzioni della chat, ovvero l'aggiunta/rimozione di partecipanti*/
app.put('/api/chat/:chatid', function(req,res) {

});

// Invio nuovo messaggio
app.post('/api/chat/:chatid/message', function(req,res) {

});

// Abbandono di una chat da parte dell'utente corrente
app.put('/api/chat/:id/:userid/leave', function(req,res) {

});

// Get chat list of current user
app.get('/api/chat/all/user/:userid', function(req,res) {

});

// Get list of messages of a chat
app.get('/api/chat/:chatid', function(req,res) {
    getMessageList(req.params.chatid)
        .then(function(messages){
            res.status(201).send(messages);
        })
        .catch(function(){
            res.status(404).send('404');
        });
});


//FIREBASE MANAGER
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





// PRIVATE FUNCTIONS
function createChat(chat) {
    return new Promise(function (resolve, reject) {
        myFirebaseManager.createChat(chat)
        .then(function () {
            resolve();
        })
        .catch(function () {
            reject();
        });
    });
}

function getMessageList(chatId) {
    return new Promise(function (resolve, reject) {
        myFirebaseManager.getAllMessages(chatId)
            .then(function (messages) {
                resolve(messages);
            })
            .catch(function () {
                reject();
            });
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