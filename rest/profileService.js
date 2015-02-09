/**
 * Created by randy on 9/4/14.
 */

var ProfileController           = require('./controllers/profileController');
var TagController               = require('./controllers/tagController');
var passport                    = require('passport');

module.exports = function() {

    var express = require('express');
    var app = express();

    app.get('/', passport.authenticate('bearer', { session: false }), ProfileController.getProfiles);
    app.get('/:id', passport.authenticate('bearer', { session: false }), ProfileController.getOneProfile);
    app.get('/:id/conversations', passport.authenticate('bearer', { session: false }), ProfileController.getConversations);
    app.post('/', passport.authenticate('bearer', { session: false }), ProfileController.newProfile);
    app.put('/:id', passport.authenticate('bearer', { session: false }), ProfileController.update);
    app.delete('/:id', passport.authenticate('bearer', { session: false }), ProfileController.remove);

    //app.get('/tags', passport.authenticate('bearer', { session: false }), TagController.getAll);
    app.get(':id/tags', passport.authenticate('bearer', { session: false }), TagController.getAllByProfileId);
    //app.delete(':id/tags/', passport.authenticate('bearer', { session: false }), TagController.removeAllByProfileId);
    app.get(':id/tags/:label', passport.authenticate('bearer', { session: false }), TagController.getOneByProfileId);
    //app.post(':id/tags/:label', passport.authenticate('bearer', { session: false }), TagController.newByProfileId);
    app.put(':id/tags/:label', passport.authenticate('bearer', { session: false }), TagController.updateByProfileId);
    app.delete(':id/tags/:label', passport.authenticate('bearer', { session: false }), TagController.removeByProfileId);

    return app;
}();