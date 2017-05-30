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

module.exports = {
    getFirebaseToken
};