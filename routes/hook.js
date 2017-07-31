const express = require('express');
const router = express.Router();
const schema = require('../db/schema');
const FirebaseManager = require('../managers/firebase-manager');
const {errorHandler} = require('../helpers/enum');
const logger = require('winston');

/**
 * Creation of a new user, called when a new user is registered after registration.
 * User id is mandatory and it is the one generated during registration.
 * If user id is existing then that user is overwritten.
 */
router.post('/users', function(req, res) {
    logger.info(Date() + ' - ' + req.method + ' /hook/' + req.path);
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
        logger.info(Date() + ' - ' + errorHandler.BAD_REQUEST);
        res.sendStatus(errorHandler.BAD_REQUEST);
    }
});

/**
 * Update user info (name and/or image)
 */
router.put('/users/:userid', function (req, res) {
    logger.info(Date() + ' - ' + req.method + ' /hook/' + req.path);
    let user = req.body;
    if (schema.validateUserUpdate(user)) {
        FirebaseManager.updateUser(req.params.userid, user)
            .then(result => {
                res.sendStatus(result);
            })
            .catch(error => {
                res.sendStatus(error);
            });
    } else {
        logger.info(Date() + ' - ' + errorHandler.BAD_REQUEST);
        res.sendStatus(errorHandler.BAD_REQUEST);
    }
});

module.exports = router;