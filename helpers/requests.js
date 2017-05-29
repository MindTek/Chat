const request = require('request');

function getFirebaseToken(users, callback) {

    // CHECK THAT USERS IS NOT EMPTY
    var loginEndpoint = 'http://www.example.com/getFBT';
    var p = new Promise(function(resolve, reject) {
        request.post({url: loginEndpoint, form: users}, function(error, response, body){
            if (error) {
                reject(error);
            } else {
                resolve(["bk3RNwTe3H0:CI2k_HHwgIpoDKCIZvvDMExUdFQ3P12", "ecupwIfBy1w:APA91bFtuMY7MktgxA3Au_Qx7cKqnf"]);
            }
        });
    });

    return p;
}

module.exports = {
    getFirebaseToken
};