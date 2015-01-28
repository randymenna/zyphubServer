/**
 * Created by randy on 9/4/14.
 */

var GroupController           = require('./controllers/groupController');
var passport                    = require('passport');

module.exports = function() {

    var express = require('express');
    var app = express();

    app.get('/',  passport.authenticate('bearer', { session: false }), GroupController.getGroups);
    app.post('/',  passport.authenticate('bearer', { session: false }), GroupController.newGroup);
    //app.put('/', GroupController.updateGroup);
    //app.delete('/', GroupController.removeGroup);
    app.get('/:id',  passport.authenticate('bearer', { session: false }), GroupController.getOneGroup);
    app.post('/:id/join',  passport.authenticate('bearer', { session: false }), GroupController.joinGroup);
    app.post('/:id/leave',  passport.authenticate('bearer', { session: false }), GroupController.leaveGroup);

    return app;
}();