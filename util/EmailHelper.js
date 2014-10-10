/**
 * Created by randy on 8/19/14.
 */

var async           = require('async');
var config          = require('config');
var mustache        = require('mustache');
var fs              = require('fs');
var path            = require('path');
var sendgrid        = require('sendgrid')(config.sendgrid.api_user, config.sendgrid.api_key);


var templatesDir = path.resolve(__dirname, '..', '..', 'templates', 'notification');

var cancelTemplate = null;
var accountDisableTemplate = null;

var EmailHelper = module.exports = function EmailHelper () {
    cancelTemplate = fs.readFileSync( templatesDir + '/cancelSubscription.html',"utf8");
    mustache.parse( cancelTemplate );
    accountDisableTemplate = fs.readFileSync( templatesDir + '/accountDisable.html',"utf8");
    mustache.parse( accountDisableTemplate );
};

EmailHelper.prototype.deviceRemoved = function( userEmail, device, devicePlan ) {

    var self = this;
    var templateVars;
    var sendToAddress = config.support.email;

    templateVars = {
        user: userEmail,
        iccid: device.iccid,
        plan: devicePlan.plan.name
    };

    var subject = "DELETED DEVICE";
    var html = mustache.render(cancelTemplate, templateVars);

    // send the email
    var mailOptions = {
        from: "noreply@cptechnologies.com",
        to: sendToAddress,
        subject: subject,
        html: html
    };

    self.sendEmail(mailOptions);
}

EmailHelper.prototype.sendAccountDisableEmail = function( userEmail ) {

    var self = this;
    var templateVars;
    var sendToAddress = config.support.email;

    templateVars = {
        user: userEmail
    };

    var subject = "ACCOUNT DISABLED";
    var html = mustache.render(accountDisableTemplate, templateVars);

    // send the email
    var mailOptions = {
        from: "noreply@cptechnologies.com",
        to: sendToAddress,
        subject: subject,
        html: html
    };

    self.sendEmail(mailOptions);
}

EmailHelper.prototype.sendEmail = function(mailOptions) {

    var sendGridEmail = new sendgrid.Email(mailOptions);

    sendgrid.send(sendGridEmail,function(err,json) {
        if (err) {
            console.log("error while sending email to %s with subject %s: %s", mailOptions.to, mailOptions.subject, err);
        } else {
            console.log("sent email to %s with subject %s: %s", mailOptions.to, mailOptions.subject, json);
        }
    });
};
