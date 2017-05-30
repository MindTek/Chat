const express = require('express');
const router = express.Router();
const schema = require('../db/schema');
const FirebaseManager = require('../managers/firebase-manager');
const {logger} = require('../helpers/init');
const {notification_title, errorHandler, httpCode} = require('../helpers/enum');

/**
 * Creation of a new user, called when a new user is registered after registration.
 * User id is mandatory and it is the one generated during registration.
 * If user id is existing then that user is overwritten.
 */
router.post('/users', function(req, res) {
    var user = req.body;
    logger(user);
    if (schema.validateUser(user)) {
        FirebaseManager.createUser(user)
            .then(function () {
                res.sendStatus(httpCode.CREATED);
            })
            .catch(function (error) {
                res.sendStatus(errorHandler.INTERNAL_SERVER_ERROR);
            });
    } else {
        res.sendStatus(errorHandler.BAD_REQUEST);
    }
});

/**
 * Update user info (name and/or image)
 */
router.put('/users/:userid', function (req, res) {
    var user = req.body;
    if (schema.validateUser(user)) {
        FirebaseManager.updateUser(user)
            .then(function () {
                res.sendStatus(httpCode.OK);
            })
            .catch(function (error) {
                res.sendStatus(errorHandler.INTERNAL_SERVER_ERROR);
            });
    } else {
        res.sendStatus(errorHandler.BAD_REQUEST);
    }
});

module.exports = router;