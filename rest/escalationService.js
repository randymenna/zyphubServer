/**
 * Created by peter on 10/20/14
 */
var EscalationController     = require('./controllers/escalationController');
var cpBus                    = require('../bus');

module.exports = function() {

    var express = require('express');
    var app = express();

    app.get('/', EscalationController.getEscalations);
    app.post('/', EscalationController.newEscalation);

    cpBus.connection.on('error',function(err) {
        console.error("Escalation Controller: Unable to connect to bus: " + err);
    });

    cpBus.connection.on('ready',function() {
    });

    return app;
}();