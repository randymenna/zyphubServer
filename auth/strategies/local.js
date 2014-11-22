'use strict';

/**
 * Module dependencies.
 */
//var passport = require('passport'),
var	LocalStrategy = require('passport-local').Strategy,
	User = require('mongoose').model('User');

module.exports = function(passport) {
	// Use local strategy
	passport.use(new LocalStrategy({
			usernameField: 'email',
			passwordField: 'password'
		},
		function(username, password, done) {
			console.log("local");
			User.findOne({
				email: username
			},function(err, user) {
				if (err) {
					return done(err);
				}
				if (!user) {
					return done(null, false, {
						message: 'Unknown user or invalid password'
					});
				}
				if (!user.authenticate(password)) {
					return done(null, false, {
						message: 'Unknown user or invalid password'
					});
				}

				return done(null, user);
			});
		}
	));
};