'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport');

// User Routes
var ContextController 				= require('./controllers/contextController');

module.exports = function() {

	var express = require('express');
	var app = express();

	app.post('/', passport.authenticate('bearer', { session: false }), ContextController.newContext);
	app.get('/', passport.authenticate('bearer', { session: false }), ContextController.getAll);
	app.get('/:id', passport.authenticate('bearer', { session: false }), ContextController.getOne);
	app.delete('/:id', passport.authenticate('bearer', { session: false }),ContextController.remove);

	return app;
}();
