'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport');

// User Routes
var UserController 				= require('./controllers/userController');

module.exports = function() {

	var express = require('express');
	var app = express();

	app.post('/',  passport.authenticate('bearer', { session: false }), UserController.signup);
	app.post('/login',  passport.authenticate('bearer', { session: false }), UserController.signin);
	app.post('/logout',  passport.authenticate('bearer', { session: false }), UserController.signout);

	//app.get('/', UserController.requiresLogin, UserController.me);
	app.get('/', passport.authenticate('bearer', { session: false }), UserController.me);

	app.put('/',  passport.authenticate('bearer', { session: false }), UserController.update);

	return app;
}();
/*
module.exports = function() {
	var express = require('express');
	var app = express();

	// Setting up the users authentication api
	app.post('/', userController.signup);
	app.post('/signin', userController.signin);
	app.get('/signout', userController.signout);


		// Setting up the users profile api
		app.get('/users/me', userController.me);
		app.put('/users', userController.update);
		app.delete('/users/accounts', userController.removeOAuthProvider);

		// Setting up the users password api
		app.post('/users/password', userController.changePassword);
		app.post('/auth/forgot', userController.forgot);
		app.get('/auth/reset/:token', userController.validateResetToken);
		app.post('/auth/reset/:token', userController.reset);

		// Setting up the users authentication api
		app.post('/auth/signup', userController.signup);
		app.post('/auth/signin', userController.signin);
		app.get('/auth/signout', userController.signout);

		// Setting the facebook oauth routes
		app.get('/auth/facebook', passport.authenticate('facebook', {
			scope: ['email']
		}));
		app.get('/auth/facebook/callback', userController.oauthCallback('facebook'));

		// Setting the twitter oauth routes
		app.get('/auth/twitter', passport.authenticate('twitter'));
		app.get('/auth/twitter/callback', userController.oauthCallback('twitter'));

		// Setting the google oauth routes
		app.get('/auth/google', passport.authenticate('google', {
			scope: [
				'https://www.googleapis.com/auth/userinfo.profile',
				'https://www.googleapis.com/auth/userinfo.email'
			]
		}));
		app.get('/auth/google/callback', userController.oauthCallback('google'));

		// Setting the linkedin oauth routes
		app.get('/auth/linkedin', passport.authenticate('linkedin'));
		app.get('/auth/linkedin/callback', userController.oauthCallback('linkedin'));

		// Setting the github oauth routes
		app.get('/auth/github', passport.authenticate('github'));
		app.get('/auth/github/callback', userController.oauthCallback('github'));

		// Finish by binding the user middleware
		//app.param('userId', userController.userByID);

		return app;
};
 */