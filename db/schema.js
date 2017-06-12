const jsonValidator = require('ajv');

/* JSON VALIDATION */
var ajv = new jsonValidator({allErrors: true});
var chatSchema = {
    "properties": {
        "id": { "type": "string" },
        "img": { "type": "string" },
        "last_message": {
            "properties": {
                "text": { "type": "string" },
                "timestamp": { "type": "string" }
            },
            "required": ["text", "timestamp"]
        },
        "name": { "type": "string" },
        "type": { "enum": ["SINGLE", "GROUP"] },
    },
    "additionalProperties": false,
    "required": ["type", "img", "name"]
};
var chatUpdateSchema = {
    "properties": {
        "img": { "type": "string" },
        "name": { "type": "string" },
    },
    "additionalProperties": false,
};
var messageSchema = {
    "properties": {
        "chat_id": { "type": "string" },
        "sender": {
            "properties" : {
                "id": { "type":"string" },
                "name": { "type":"string" }
            },
            "required": ["id", "name"]
        },
        "text": { "type": "string" },
        "type": { "type": "string" },
    },
    "additionalProperties": false,
    "required": ["sender", "text", "type"]
};
var userSchema = {
    "properties": {
        "chats": {
            "type": "object",
        },
        "full_name": { "type": "string" },
        "id": { "type": "number" },
        "img": { "type": "string" },
    },
    "additionalProperties": false,
    "required": ["id", "full_name", "img"]
};

function validateChat(chat) {
    return ajv.validate(chatSchema, chat);
}

function validateChatUpdate(chat) {
    return ajv.validate(chatUpdateSchema, chat);
}

function validateMessage(message) {
    return ajv.validate(messageSchema, message);
}

function validateUser(user) {
    return ajv.validate(userSchema, user);
}

module.exports = {
    validateChat: validateChat,
    validateMessage: validateMessage,
    validateUser: validateUser,
    validateChatUpdate: validateChatUpdate
};