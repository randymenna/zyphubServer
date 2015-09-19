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
    app.post('/', passport.authenticate('bearer', { session: false }), ProfileController.newProfile);
    app.put('/:id', passport.authenticate('bearer', { session: false }), ProfileController.update);
    app.delete('/:id', passport.authenticate('bearer', { session: false }), ProfileController.remove);

    app.get('/:id/conversations', passport.authenticate('bearer', { session: false }), ProfileController.getConversations);
    app.get('/:id/conversations/:cid', passport.authenticate('bearer', { session: false }), ProfileController.getConversations);

    app.get('/:id/contexts', passport.authenticate('bearer', { session: false }), TagController.getAllByProfileId);
    app.get('/:pid/contexts/:tid', passport.authenticate('bearer', { session: false }), TagController.getOneByProfileId);
    app.post('/:id/contexts', passport.authenticate('bearer', { session: false }), TagController.newByProfileId);
    app.put('/:pid/contexts/:tid', passport.authenticate('bearer', { session: false }), TagController.updateByProfileId);
    app.delete('/:id/contexts/', passport.authenticate('bearer', { session: false }), TagController.removeAllByProfileId);
    app.delete('/:pid/contexts/:tid', passport.authenticate('bearer', { session: false }), TagController.removeOneByProfileId);

    return app;
}();