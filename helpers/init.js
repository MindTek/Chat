/* LOGGING */
const logger = require('winston');

/* ENVIRONMENT */
var environment = {
    projectName: process.env.MM_PROJECT_NAME,
    chatDBUrl: process.env.MM_CHAT_DB_URL,
    chatDBUsername: process.env.MM_CHAT_DB_USERNAME,
    chatDBPassword: process.env.MM_CHAT_DB_PASSWORD,
    chatServerPort: process.env.MM_CHAT_SERVER_PORT,
    development: process.env.MM_CHAT_DEVELOPMENT
};

module.exports = {
    logger,
    environment
}