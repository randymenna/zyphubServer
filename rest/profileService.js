/**
 * Created by randy on 9/4/14.
 */

var ProfileController           = require('./controllers/profileController');
//var TagController 				= require('./controllers/tagController');
var passport                    = require('passport');

module.exports = function() {

    var express = require('express');
    var app = express();

    app.get('/', passport.authenticate('bearer', { session: false }), ProfileController.getProfiles);
    app.get('/:id', passport.authenticate('bearer', { session: false }), ProfileController.getOneProfile);
    app.get('/:id/conversations', passport.authenticate('bearer', { session: false }), ProfileController.getConversations);
    app.post('/', passport.authenticate('bearer', { session: false }), ProfileController.newProfile);
/*
    app.get('/tags', passport.authenticate('bearer', { session: false }), TagController.getProfileTags);
    app.get('/tags/:label', passport.authenticate('bearer', { session: false }), TagController.getOneProfileTag);
    app.post('/tags/:label', passport.authenticate('bearer', { session: false }), TagController.newProfileTag);
    app.put('/tags/:label', passport.authenticate('bearer', { session: false }), TagController.updateProfileTag);
    app.delete('/tags/:label', passport.authenticate('bearer', { session: false }), TagController.removeProfileTag);
*/
    return app;
}();