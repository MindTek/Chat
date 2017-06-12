/* MAIN */
const api = require('./routes/api');
const hook = require('./routes/hook');
const port = 8080;
const LoginManager = require('./helpers/communication');
const {errorHandler, httpCode} = require('./helpers/enum');
var compression = require('compression')
const bodyParser = require('body-parser');
const logger = require('winston');
const express = require('express');
const app = express();

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
var serverErrorHandler = function (err, req, res, next) {
    if (err.status == errorHandler.BAD_REQUEST) {
        res.sendStatus(errorHandler.BAD_REQUEST);
    } else {
        res.sendStatus(errorHandler.INTERNAL_SERVER_ERROR);
    }
    
}
app.use(compression())
app.use(authentication);
app.use(bodyParser.json());
app.use('/api', api);
app.use('/hook', hook);
app.use(serverErrorHandler);
app.listen(port, function () {
  logger.info('Web server started!');
});