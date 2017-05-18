/* MAIN */
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('winston');
const app = express();
const api = require('./routes/api');
const hook = require('./routes/hook');

/* ENVIRONMENT */
/*
var projectName = process.env.MM_PROJECT_NAME;
var chatDBUrl = process.env.MM_CHAT_DB_URL;
var chatDBUsername = process.env.MM_CHAT_DB_USERNAME;
var chatDBPassword = process.env.MM_CHAT_DB_PASSWORD;
var chatServerPort = process.env.MM_CHAT_SERVER_PORT;
var development = process.env.MM_CHAT_DEVELOPMENT;
*/

/* ROUTING AND LOGGING */
app.use(bodyParser.json());
app.use('/api', api);
app.use('/hook', hook);
app.listen(3000, function () {
  logger.info('Listening on port 3000...');
});