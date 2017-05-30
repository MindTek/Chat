var notification_title = {
    ADDED : "You were added to a group.",
    MESSAGE : "New message",
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
    NOT_ACCEPTABLE: 406
};

module.exports = {
   notification_title,
    httpCode,
    errorHandler
};
