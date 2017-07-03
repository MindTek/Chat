const logger = require('winston');
const request = require('request');
const SERVER = "http://development.bikeapp.mindtek.it/api";
const fs = require('fs');

function getFirebaseToken(users, callback) {
    var options = {
        url: SERVER + '/hook/firebasetoken',
        body: users,
        json: true
    };
    console.log('users: ' + JSON.stringify(users));
    var p = new Promise(function(resolve, reject) {
        //MOCK
        //resolve([ 'dY4QOPKviEY:APA91bFYP21OBi9OHaNbju_hEXX-zkFj20VvTqk2hzKnefO6ZX3qr8wgRYDjko5ndXkR0rGwbc3-Njm9CvMqVA20ogV0tj_jVwer3pixxTgfi2RjhzVY9GWdcQ2Njay4ZDGt3aPIXv1C','fVQl8MtXQqQ:APA91bF_rhXdPg1TCguxdsvYw2ESGThVpgcnF7G4Z2gYbYNobQ8gVN7WzSORr0eYkOOcwwZaaPkUMclnkJKNwTv6lpclpbDrvO_iIu3jbRYkRex23j-ek3Rells_-EgYMlf7DORiPjtg' ]);
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
        url: SERVER + '/hook/authorization',
        headers: {
            'X-Token': token
        }
    };
    console.log(token);
    var p = new Promise(function(resolve, reject) {
        //MOCK
        //resolve({'auth':true, 'id': 2});
        request.get(options, function(error, response, body){
            console.log(response.statusCode);
            let result = (response.statusCode == 200) ? true : false;
            let bodyJson = response.body;
            let resultArray = new Array();
            if (result) {
                let status = bodyJson["status"];
                let userId = bodyJson["user_id"];
                let toReturn = {
                    "auth": response.statusCode,
                    "user_id": userId
                }
                resolve(toReturn);
            } else {
                reject();
            }
        });
    });
    return p;
}

/**
 * Post file to external service and returns URL
 */
function postFile(file) {
    var boundaryKey = Math.random().toString(16);
    var options = {
        url: SERVER + '/hook/upload_image',
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
                    let imageUrl = (bodyJson['image_url']);
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