const express = require('express');
const router = express.Router();
const schema = require('../db/schema');
const FirebaseManager = require('../managers/firebase-manager');

/**
 * Placeholder to show an entry point.
 */
router.get('/', function(req, res) {
    res.send('Ciao! Benvenuto nel modulo di chat!');
});

/**
 * Create a new chat, of either single or group.
 */
router.post('/chat', function(req, res) {
    var chat = req.body;
    if (schema.validateChat(chat)) {
        FirebaseManager.createChat(chat)
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

/**
 * Update name, image and participants of a specific chat.
 * Participants MUST be passed as an array.
 */
router.put('/chat/:chatid', function(req, res) {
    var chat = req.body;
    if (schema.validateChat(chat)) {
        FirebaseManager.updateChat(chat)
        .then(function () {
            res.sendStatus(201);
        })
        .catch(function () {
            res.sendStatus(400);
        });
    } else {
        res.sendStatus(400);
    }

});

/**
 * Create and post a new message to a chat.
 * Send notification to user involved in that chat.
 */
router.post('/chat/:chatid/message', function(req, res) {
    var message = req.body;
    if (schema.validateMessage(message)) {
        FirebaseManager.saveMessage(message)
            .then(function (statusCode) {
                res.status(200).send(message);
            })
            .catch(function (errorCode) {
                res.sendStatus(errorCode);
            });
        // Get token from LOGIN module, passing all participants in chat :chatid
        FirebaseManager.sendMessage(["registration_token_1"], "Test", "This is the body of the notification", {custom: "This is a custom field!"})
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

/**
 * Remove a user from a specific chat when it decide to leave it.
 * TODO: MAnage logic to get user role and to decide what to do according to it.
 */
router.put('/chat/:chatid/users/:userid/remove', function(req,res) {
    FirebaseManager.removeUser(req.params.userid, req.params.chatid)
        .then(function () {
            res.status(201).send('201');
        })
        .catch(function () {
            res.status(404).send('404');
        });
});

/**
 * Get chats list of specific user.
 * Return an array of chats.
 */
router.get('/chat/all/user/:userid', function(req,res) {
    FirebaseManager.getChats(req.params.userid)
        .then(function (chats) {
            console.log(chats);
            res.status(201).send(chats);
        })
        .catch(function () {
            res.status(404).send('404');
        });
});

/**
 * Get alla messages in a chat.
 */
router.get('/chat/:chatid/message/all', function(req,res) {
    FirebaseManager.getAllMessages(req.params.chatid)
        .then(function (messages) {
            res.status(201).send(messages);
        })
        .catch(function () {
            res.status(404).send('404');;
        });
});

/**
 * Get information and status of a chat.
 */
router.get('/chat/:chatid', function(req,res) {
    FirebaseManager.getChatInfo(req.params.chatid)
        .then(function (info) {
            res.status(201).send(info);
        })
        .catch(function () {
            res.status(404).send('404');;
        });
});

/**
 * Get participants of a chat.
 */
router.get('/chat/:chatid/user/all', function(req,res) {
    FirebaseManager.getChatUsers(req.params.chatid)
        .then(function (users) {
            res.status(201).send(users);
        })
        .catch(function () {
            res.status(404).send('404');;
        });
});

/**
 * Delete chat, set a flag on it.
 * TODO: remove chat reference from user ???
 */
router.delete('/chat/:chatid', function (req,res) {
    FirebaseManager.deleteChat(req.params.chatid)
        .then(function () {
            res.status(201).send('201');
        })
        .catch(function () {
            res.status(404).send('404');
        });
});

/**
 * Get latest message (one only) of a specific chat.
 */
router.get('/chat/:chatid/lastmessage', function(req, res) {
    FirebaseManager.getLastMessage(req.params.chatid)
        .then(function () {
            res.status(201).send('201');
        })
        .catch(function () {
            res.status(404).send('404');
        });
});

module.exports = router;