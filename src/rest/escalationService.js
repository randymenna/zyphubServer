/**
 * Created by peter on 10/20/14
 */
var EscalationController     = require('./controllers/escalationController');
var cpBus                    = require('../bus/index');
var passport                    = require('passport');

module.exports = function() {

    var express = require('express');
    var app = express();

    app.get('/',  passport.authenticate('bearer', { session: false }), EscalationController.getEscalations);
    app.post('/',  passport.authenticate('bearer', { session: false }), EscalationController.newEscalation);
    //app.put('/', EscalationController.updateEscalation);
    //app.delete('/', EscalationController.removeEscalation);

    /*
    cpBus.connection.on('error',function(err) {
        console.error('Escalation Controller: Unable to connect to bus: ' + err);
    });

    cpBus.connection.on('ready',function() {
    });
    */

    return app;
}();