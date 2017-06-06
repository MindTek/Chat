const express = require('express');
const router = express.Router();
const schema = require('../db/schema');
const FirebaseManager = require('../managers/firebase-manager');
const {errorHandler} = require('../helpers/enum');

/**
 * Creation of a new user, called when a new user is registered after registration.
 * User id is mandatory and it is the one generated during registration.
 * If user id is existing then that user is overwritten.
 */
router.post('/users', function(req, res) {
    let user = req.body;
    if (schema.validateUser(user)) {
        FirebaseManager.createUser(user)
            .then(result => {
                res.sendStatus(result);
            })
            .catch(error => {
                res.sendStatus(error);
            });
    } else {
        res.sendStatus(errorHandler.BAD_REQUEST);
    }
});

/**
 * Update user info (name and/or image)
 */
router.put('/users/:userid', function (req, res) {
    let user = req.body;
    if (schema.validateUser(user)) {
        FirebaseManager.updateUser(user)
            .then(result => {
                res.sendStatus(result);
            })
            .catch(error => {
                res.sendStatus(error);
            });
    } else {
        res.sendStatus(errorHandler.BAD_REQUEST);
    }
});

module.exports = router;