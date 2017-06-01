const {logger} = require('../helpers/init');
const request = require('request');

function getFirebaseToken(users, callback) {
    var options = {
        url: 'http://192.168.60.90:3000/hook/user/firebasetoken',
        body: users,
        json: true
    };
    var p = new Promise(function(resolve, reject) {
        request.post(options, function(error, response, body){
            if (error) {
                reject(error);
            } else {
                /*let resultArray = new Array();
                body.forEach(function(u) {
                    resultArray.push(u['firebase_token']);
                });
                resolve(resultArray);*/
                //MOCK
                resolve([ 'fE-avN0BOlM:APA91bH52eczdMGM3ZUnZg2d_f9EMZMC23CdXhnzu1044eX8V8WmuwYREDMMsz37MdukRtj4sZoUwayW2Nsn1OubBuq9sNoA8GR_z04kIWR4EZsSvQD2Wca_rP3HURI0zZCTL5uZTXbo' ]);
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
        url: 'http://192.168.60.90:3000/hook/user/authorization',
        headers: {
            'Authorization': token
        }
    };
    var p = new Promise(function(resolve, reject) {
        request.get(options, function(error, response, body){
            //MOCK
            resolve({'auth':true, 'id': 2});
            /*if (error) {
                reject();
            } else {
                let result = (response.statusCode == 200) ? true : false;
                let userid = (response.body
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