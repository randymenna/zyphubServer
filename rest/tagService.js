'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport');

// User Routes
var TagController 				= require('./controllers/tagController');

module.exports = function() {

	var express = require('express');
	var app = express();

	app.post('/', passport.authenticate('bearer', { session: false }), TagController.newTag);
	app.get('/', passport.authenticate('bearer', { session: false }), TagController.getAll);
	app.get('/:id', passport.authenticate('bearer', { session: false }), TagController.getOne);
	app.put('/:id', passport.authenticate('bearer', { session: false }),TagController.update);
	app.delete('/:id', passport.authenticate('bearer', { session: false }),TagController.remove);

	return app;
}();
