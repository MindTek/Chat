var notification = {
    ADDED : "Sei stato aggiunto a una chat.",
    MESSAGE : "Hai ricevuto un nuovo messaggio.",
    NEWUSERADDED : "Un utente è stato aggiunto alla chat.",
    USERREMOVED: "Un utente ha abbandonato la chat.",
    CHATUPDATED: "La chat è stata modificata.",
    CHATCREATED: "La chat è stata creata."
};

var httpCode = {
    OK: 200,
    CREATED: 201
};

var errorHandler = {
    BAD_REQUEST: 400,
    NOT_AUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
    CONFLICT: 409,
    NOT_ACCEPTABLE: 406,
    FAILED_DEPENDENCY: 424
};

module.exports = {
   notification,
    httpCode,
    errorHandler
};