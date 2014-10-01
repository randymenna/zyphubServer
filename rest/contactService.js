/**
 * Created by al on 9/4/14.
 */

var ContactController           = require('./controllers/contactController');

module.exports = function() {

    var express = require('express');
    var app = express();

    app.get('/', ContactController.getContacts);
    app.post('/', ContactController.newContact);


    return app;
}();