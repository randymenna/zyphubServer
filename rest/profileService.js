/**
 * Created by al on 9/4/14.
 */

var ProfileController           = require('./controllers/profileController');

module.exports = function() {

    var express = require('express');
    var app = express();

    app.get('/', ProfileController.getProfiles);
    app.get('/:id', ProfileController.getOneProfile);
    app.get('/:id/conversations', ProfileController.getConversations);
    app.post('/', ProfileController.newProfile);


    return app;
}();