/**
 * Created by randy on 9/4/14.
 */

var AuditController                 = require('./controllers/auditController');
var passport                        = require('passport');


module.exports = function() {

    var express = require('express');
    var app = express();

    app.get('/:id', passport.authenticate('bearer', { session: false }), AuditController.getOneAuditTrail);

    return app;
}();