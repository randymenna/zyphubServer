/**
 * Created by randy on 9/4/14.
 */

var ProfileController           = require('./controllers/profileController');
var passport                    = require('passport');

module.exports = function() {

    var express = require('express');
    var app = express();

    app.get('/', passport.authenticate('bearer', { session: false }), ProfileController.getProfiles);
    app.get('/:id', passport.authenticate('bearer', { session: false }), ProfileController.getOneProfile);
    app.get('/:id/conversations', passport.authenticate('bearer', { session: false }), ProfileController.getConversations);
    app.post('/', passport.authenticate('bearer', { session: false }), ProfileController.newProfile);
    /*
     app.put('/:id', passport.authenticate('bearer', { session: false }), ProfileController.updateProfile);
     app.delete('/:id', passport.authenticate('bearer', { session: false }), ProfileController.removeProfileT);
     */
/*
    app.get(':id/tags', passport.authenticate('bearer', { session: false }), TagController.getProfileTags);
    app.delete(':id/tags/', passport.authenticate('bearer', { session: false }), TagController.removeAllProfileTags);
    app.get(':id/tags/:label', passport.authenticate('bearer', { session: false }), TagController.getOneProfileTag);
    app.post(':id/tags/:label', passport.authenticate('bearer', { session: false }), TagController.newProfileTag);
    app.put(':id/tags/:label', passport.authenticate('bearer', { session: false }), TagController.updateProfileTag);
    app.delete(':id/tags/:label', passport.authenticate('bearer', { session: false }), TagController.removeProfileTag);
*/
    return app;
}();