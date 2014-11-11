/**
 * Created by al on 9/4/14.
 */

var GroupController           = require('./controllers/groupController');

module.exports = function() {

    var express = require('express');
    var app = express();

    app.get('/', GroupController.getGroups);
    app.get('/:id', GroupController.getOneGroup);
    app.post('/', GroupController.newGroup);
    app.post('/:id/join', GroupController.joinGroup);
    app.post('/:id/leave', GroupController.leaveGroup);

    return app;
}();