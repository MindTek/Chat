// Main application script
//const chatRouter = require('./routes');
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('winston');
const app = express();
const promise = require('promise');
const FirebaseManager = require('./managers/firebase-manager');
const api = require('./routes/api');
const hook = require('./routes/hook');

// Get all environment constants
/*var projectName = process.env.MM_PROJECT_NAME;
var chatDBUrl = process.env.MM_CHAT_DB_URL;
var chatDBUsername = process.env.MM_CHAT_DB_USERNAME;
var chatDBPassword = process.env.MM_CHAT_DB_PASSWORD;
var chatServerPort = process.env.MM_CHAT_SERVER_PORT;
var development = process.env.MM_CHAT_DEVELOPMENT;*/

/* FIREBASE MANAGER */
var myFirebaseManager = new FirebaseManager();
if (!myFirebaseManager.isConnected()) {
    logger.info(myFirebaseManager.getError().message);
} else {
    logger.info("Firebase connection: " + myFirebaseManager.isConnected())
}

/* ROUTING AND LOGGING */
app.use(bodyParser.json());
app.use('/api', api);
app.use('/hook', hook);
app.listen(3000, function () {
  logger.info('Listening on port 3000...');
});



