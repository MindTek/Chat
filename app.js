/* MAIN */
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('winston');
const app = express();
const api = require('./routes/api');
const hook = require('./routes/hook');
const port = 8080;
const LoginManager = require('./helpers/communication');

/* ROUTING INIT */
// Create a middleware to verify authentication
var authentication = function (req, res, next) {
    LoginManager.authenticate(req.header('Authorization'))
        .then(function(response) {
            req.auth = response.auth;
            req.sender = response.id;
            next();
        })
        .catch(function(error) {
            req.auth = false;
            next();
    });
};
app.use(authentication);
app.use(bodyParser.json());
app.use('/api', api);
app.use('/hook', hook);
app.listen(port, function () {
  logger.info('Web server started!');
});