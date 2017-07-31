const logger = require('winston');
const request = require('request');
const env = require('./../config/env.json');
const fs = require('fs');

const ATTACHMENT_SERVER = env.ATTACHMENT_SERVER;
const AUTH_SERVER = env.LOGIN_SERVER;

function getFirebaseToken(users, callback) {
    var options = {
        url: AUTH_SERVER + '/hook/firebasetoken',
        body: users,
        json: true
    };
    logger.info('users: ' + JSON.stringify(users));
    var p = new Promise(function(resolve, reject) {
        //MOCK
        //resolve([ 'token' ]);
        request.post(options, function(error, response, body){
            if (error) {
                reject(error);
            } else {
                let result = (response.statusCode == 200) ? true : false;
                let bodyJson = response.body;
                let resultArray = new Array();
                if (result && bodyJson.status) {
                    let tokens = bodyJson['user_tokens'];
                    for (var i = 0; i < tokens.length; i++) {
                        let token = tokens[i];
                        resultArray.push(token['firebasetoken']);
                    }
                    resolve(resultArray);
                } else {
                    reject();
                }
            }
        });
    });
    return p;
}

/**
 * Validate user token, sending it to login module.
 */
function authenticate(token) {
    var options = {
        url: AUTH_SERVER + '/hook/authorization',
        headers: {
            'X-Token': token
        }
    };
    var p = new Promise(function(resolve, reject) {
        //MOCK
        resolve({'auth':true, 'id': 1});
        /*request.get(options, function(error, response, body){
            let result = (response.statusCode == 200) ? true : false;
            let bodyJson = JSON.parse(response.body);
            let resultArray = new Array();
            if (result) {
                let status = bodyJson["status"];
                let userId = bodyJson["user_id"];
                let toReturn = {
                    "auth": response.statusCode,
                    "user_id": userId
                };
                logger.info(Date() + ' - Auth token: ' + token +' - User: ' + userId);
                resolve(toReturn);
            } else {
                reject();
            }
        });*/
    });
    return p;
}

/**
 * Post file to external service and returns URL
 */
function postFile(file) {
    var boundaryKey = Math.random().toString(16);
    var options = {
        url: ATTACHMENT_SERVER,
        headers: {
            'Content-Type': 'multipart/form-data; boundary=__X_PAW_BOUNDARY__'
        },
        formData: {
            file: fs.createReadStream(__dirname + '/../' + file.path),
        }
    };
    var p = new Promise(function(resolve, reject) {
        request.post(options, function(error, response, body) {
            if (error) {
                reject(error);
            } else {
                let result = (response.statusCode == 200) ? true : false;
                let bodyJson = JSON.parse(response.body);
                if (result && bodyJson.status) {
                    let fileUrl = (bodyJson['url']);
                    fs.unlink(__dirname + '/../' + file.path);
                    resolve(imageUrl);
                } else {
                    reject();
                }
            }
        });
    });
    return p;
}

module.exports = {
    getFirebaseToken,
    authenticate,
    postFile
};