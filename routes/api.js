const express = require('express');
const router = express.Router();
const schema = require('../db/schema');

// Sample page
router.get('/', function(req, res) {
    res.send('Ciao! Benvenuto nel modulo di chat!');
});

// Chat creation (single or group)
router.post('/chat', function(req, res) {
    var chat = req.body;
    if (schema.validateChat(chat)) {
        myFirebaseManager.createChat(chat)
            .then(function () {
                res.status(201).send('201');
            })
            .catch(function () {
                res.status(400).send('400');
            });
    } else {
        res.status(400).send('400');
    }

});

// modifica parametri chat 1-1 e 1-N - Qui verranno modificate tutte le opzioni della chat, ovvero l'aggiunta/rimozione di partecipanti*/
router.put('/chat/:chatid', function(req,res) {

});

// Invio nuovo messaggio
router.post('/chat/:chatid/message', function(req,res) {
    var message = req.body;
    if (schema.validateMessage(message)) {
        myFirebaseManager.saveMessage(message)
            .then(function (statusCode) {
                res.status(200).send(message);
            })
            .catch(function (errorCode) {
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
    } else {
        res.status(400).send('400');
    }
});

// Abbandono di una chat da parte dell'utente
router.put('/chat/:chatid/users/:userid/remove', function(req,res) {
    myFirebaseManager.removeUser(req.params.userid, req.params.chatid)
        .then(function () {
            res.status(201).send('201');
        })
        .catch(function () {
            res.status(404).send('404');
        });
});

// Get chat list of current user
router.get('/chat/all/user/:userid', function(req,res) {
    myFirebaseManager.getChats(req.params.userid)
        .then(function (chats) {
            res.status(201).send(chats);
        })
        .catch(function () {
            res.status(404).send('404');
        });
});

// Get list of messages of a chat
router.get('/chat/:chatid', function(req,res) {
    myFirebaseManager.getAllMessages(req.params.chatid)
        .then(function (messages) {
            res.status(201).send(messages);
        })
        .catch(function () {
            res.status(404).send('404');;
        });
});

// Delete chat
router.delete('/chat/:chatid', function (req,res) {
    myFirebaseManager.deleteChat(req.params.chatid)
        .then(function () {
            res.status(201).send('201');
        })
        .catch(function () {
            res.status(404).send('404');
        });
});

//Get last message of a chat
router.get('/chat/:chatid/lastmessage', function(req, res) {
    myFirebaseManager.getLastMessage(req.params.chatid)
        .then(function () {
            res.status(201).send('201');
        })
        .catch(function () {
            res.status(404).send('404');
        });
});

module.exports = router;