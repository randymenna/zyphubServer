/**
 * Created by al on 2/21/14.
 */

var config          = require('config');
var twilio          = require('twilio')(config.twilio.sid, config.twilio.token);

var SmsHelper = module.exports = function SmsHelper() {
}

SmsHelper.prototype.sendSms = function(mobileNumber, body, callback) {

    var twilioOptions = {
        from: config.twilio.from,
        to: mobileNumber,
        body: body
    };

    twilio.sendSms(twilioOptions, function(error, twilioMessage) {
        if (error) {
            console.log("sendSMS(): warning.  unable to send sms to twilio: %s. Retrying" , JSON.stringify(twilioOptions));
            twilio.sendSms(twilioOptions,function(error2,twilioMessage2) {
                if (error2) {
                    console.log("sendSMS(): error.  2nd attempt to send sms to twilio failed: %s. Returning error to client" , JSON.stringify(twilioOptions));
                }
                callback(error2,twilioMessage2);
            });
        } else {
            callback(error,twilioMessage);
        }
    });
};

SmsHelper.prototype.getStatus = function(messageId,callback) {
    twilio.messages(messageId).get(function(err, message) {
        callback(err,message);
    });
};