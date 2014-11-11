/**
 * Created by al on 9/4/14.
 */

var GroupController           = require('./controllers/contextController');

module.exports = function() {

    var express = require('express');
    var app = express();

    app.get('/', ContextController.getContexts);
    app.get('/:id', ContextController.getOneContext);
    app.post('/', ContextController.newContext);


    return app;
}();