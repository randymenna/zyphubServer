/**
 * Created by al on 9/4/14.
 */

var AuditController           = require('./controllers/auditController');

module.exports = function() {

    var express = require('express');
    var app = express();

    app.get('/:id', AuditController.getOneAuditTrail);

    return app;
}();