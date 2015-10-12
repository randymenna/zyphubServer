(function() {
	'use strict';
}());
/**
 * Module dependencies.
 */
var passport = require('passport');

// User Routes
var UserController 				= require('./controllers/userController');

module.exports = function() {

	var express = require('express');
	var app = express();

	app.get('/', passport.authenticate('bearer', { session: false }), UserController.me);
	//app.post('/',  passport.authenticate('bearer', { session: false }), UserController.signup);
	app.put('/:id',  passport.authenticate('bearer', { session: false }), UserController.update);

	app.post('/login', UserController.signin);
    app.post('/logout',  passport.authenticate('bearer', { session: false }), UserController.signout);

    app.post('/', UserController.authByKey);
    app.post('/login/apikey', UserController.authByKey);

    app.get('/login/google', passport.authenticate('google', {
		scope: [
			'https://www.googleapis.com/auth/userinfo.profile',
			'https://www.googleapis.com/auth/userinfo.email'
		]
	}));
	app.get('/login/facebook', passport.authenticate('facebook', {scope: ['email']}));
	app.get('/login/github', passport.authenticate('github'));
	app.get('/login/linkedin', passport.authenticate('linkedin'));


	return app;
}();

