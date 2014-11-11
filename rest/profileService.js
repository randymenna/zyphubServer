/**
 * Created by al on 9/4/14.
 */

var ContactController           = require('./controllers/profileController');

module.exports = function() {

    var express = require('express');
    var app = express();

    app.get('/', ContactController.getProfiles);
    app.get('/:id', ContactController.getOneProfile);
    app.get('/:id/conversations', ContactController.getConversations);
    app.post('/', ContactController.newProfile);


    return app;
}();