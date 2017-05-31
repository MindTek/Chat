const {logger} = require('../helpers/init');
const request = require('request');

function getFirebaseToken(users, callback) {

    // CHECK THAT USERS IS NOT EMPTY
    var loginEndpoint = 'http://www.example.com/getFBT';
    var p = new Promise(function(resolve, reject) {
        request.post({url: loginEndpoint, form: users}, function(error, response, body){
            if (error) {
                reject(error);
            } else {
                resolve(["fE-avN0BOlM:APA91bH52eczdMGM3ZUnZg2d_f9EMZMC23CdXhnzu1044eX8V8WmuwYREDMMsz37MdukRtj4sZoUwayW2Nsn1OubBuq9sNoA8GR_z04kIWR4EZsSvQD2Wca_rP3HURI0zZCTL5uZTXbo"]);
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
        url: 'http://www.modulo-login.com/users/authorization',
        headers: {
            'Authorization': token
        }
    };
    var p = new Promise(function(resolve, reject) {
        request.post(options, function(error, response, body){
            reject();
            /*if (error) {
                reject();
            } else {
            let res = response["authorized"];
                resolve(res);
            }*/
        });
    });
    return p;
}

module.exports = {
    getFirebaseToken,
    authenticate
};