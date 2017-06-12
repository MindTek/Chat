const logger = require('winston');
const request = require('request');

function getFirebaseToken(users, callback) {
    var options = {
        url: 'http://192.168.60.90:3000/hook/user/firebasetoken',
        body: users,
        json: true
    };
    var p = new Promise(function(resolve, reject) {
        //MOCK
        resolve([ 'fE-avN0BOlM:APA91bH52eczdMGM3ZUnZg2d_f9EMZMC23CdXhnzu1044eX8V8WmuwYREDMMsz37MdukRtj4sZoUwayW2Nsn1OubBuq9sNoA8GR_z04kIWR4EZsSvQD2Wca_rP3HURI0zZCTL5uZTXbo' ]);
        /*request.post(options, function(error, response, body){
            if (error) {
                reject(error);
            } else {
                let resultArray = new Array();
                body.forEach(function(u) {
                    resultArray.push(u['firebase_token']);
                });
                resolve(resultArray);
            }
        });*/
    });
    return p;
}

/**
 * Validate user token, sending it to login module.
 */
/*
 {
   "id": 41,
   "userId": 57,
   "lastLogin": "2017-05-29T15:05:33.000Z",
   "firebaseToken": "fE-avN0BOlM:APA91bH52eczdMGM3ZUnZg2d_f9EMZMC23CdXhnzu1044eX8V8WmuwYREDMMsz37MdukRtj4sZoUwayW2Nsn1OubBuq9sNoA8GR_z04kIWR4EZsSvQD2Wca_rP3HURI0zZCTL5uZTXbo",
   "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NTcsImlhdCI6MTQ5NjA3MDMzM30.4fn2_XVjLbm4e9H_gwNG6RA6vN95r5tDcJMZHGpIQLw",
   "lastTokenRefresh": "2017-05-29T15:05:33.000Z",
   "os": "ANDROID",
   "createdAt": "2017-05-29T15:05:33.000Z",
   "updatedAt": "2017-05-29T15:05:33.000Z"
 }
 */
function authenticate(token) {
    var options = {
        url: 'http://192.168.60.90:3000/hook/user/authorization',
        headers: {
            'Authorization': token
        }
    };
    var p = new Promise(function(resolve, reject) {
        //MOCK
        resolve({'auth':true, 'id': 2});
        request.get(options, function(error, response, body){
            /*if (error) {
                reject();
            } else {
                let result = (response.statusCode == 200) ? true : false;
                let userid = (response.body['userId']);
                resolve({'auth':result, 'id': userid});
            }*/
        });
    });
    return p;
}

module.exports = {
    getFirebaseToken,
    authenticate
};