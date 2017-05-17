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
        "type": { "type": "number" },
    },
    "required": ["id", "img", "last_message", "name", "type"]
};
var messageSchema = {
    "properties": {
        "chat_id": { "type": "string" },
        "id": { "type": "string" },
        "sender_name": {
            "properties": {
                "full_name": { "type": "string" },
                "id": { "type": "string" },
                "img": { "type": "string" }
            },
            "required": ["full_name", "id", "img"]
        },
        "text": { "type": "string" },
        "type": { "type": "string" },
        "time_stamp": { "type": "string" }
    },
    "required": ["id", "chat_id", "sender_name", "text", "type", "time_stamp"]
};
var userSchema = {
    "properties": {
        "chats": {
            "type": "object",
        },
        "full_name": { "type": "string" },
        "id": { "type": "string" },
        "img": { "type": "string" },
        "role": { "type": "string" },
    },
    "required": ["id", "full_name", "img", "role"]
};

function validateChat(chat) {
    return ajv.validate(chatSchema, chat);
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
    validateUser: validateUser
}