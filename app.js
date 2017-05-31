/* MAIN */
const express = require('express');
const bodyParser = require('body-parser');
const {logger} = require('./helpers/init');
const app = express();
const api = require('./routes/api');
const hook = require('./routes/hook');
const LoginManager = require('./helpers/communication');

/* ROUTING INIT */
// Create a middleware to verify authentication
var authentication = function (req, res, next) {
    console.log('Authenticating....');
    LoginManager.authenticate(req.header('Authorization'))
        .then(function(auth) {
            req.auth = auth;
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
app.listen(3000, function () {
  logger.info('Listening on port 3000...');
});