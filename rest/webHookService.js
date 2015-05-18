/**
 * Created by randy on 9/4/14.
 */

var IntegrationController           = require('./controllers/webHookController');
var passport                        = require('passport');


module.exports = function() {

    var express = require('express');
    var app = express();

    app.post('/url', IntegrationController.setWebHookUrl);
    app.post('/loopback', IntegrationController.justEcho);

    return app;
}();