const express = require('express');
const router = express.Router();
const schema = require('../db/schema');
const FirebaseManager = require('../managers/firebase-manager');

/**
 * Creation of a new user, called when a new user is registered.
 * User id is mandatory and it is the one generated during registration.
 * If user id is existing then that user is overwritten.
 * 201 -> created
 * 400 -> bad request
 * 401 -> firebase error
 */
router.post('/users', function(req, res) {
    var user = req.body;
    console.log(user);
    if (schema.validateUser(user)) {
        FirebaseManager.createUser(user)
            .then(function () {
                res.status(201).send('201');
            })
            .catch(function () {
                res.status(401).send('401');
            });
    } else {
        res.status(400).send('400');
    }
});

/**
 * Update user info (name and/or image
 * 200 -> updated
 * 400 -> bad request
 * 401 -> firebase error
 */
router.put('/users/:userid', function (req, res) {
    var user = req.body;
    if (schema.validateUser(user)) {
        FirebaseManager.updateUser(user)
            .then(function () {
                res.status(200).send('200');
            })
            .catch(function () {
                res.status(401).send('401');
            });
    } else {
        res.status(400).send('400');
    }
});

module.exports = router;