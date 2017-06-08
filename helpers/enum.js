var notification = {
    ADDED : "You were added to a group.",
    MESSAGE : "New message",
    NEWUSERADDED : "A new user has been added to this chat",
    USERREMOVED: "An user has been removed",
    CHATUPDATED: "Chat has been updated"
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
