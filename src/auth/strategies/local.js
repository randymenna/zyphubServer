(function() {
	'use strict';
}());
/**
 * Module dependencies.
 */
//var passport = require('passport'),
var	LocalStrategy = require('passport-local').Strategy,
	User = require('mongoose').model('User');

module.exports = function(passport) {
    console.log('local');

    passport.use(new LocalStrategy({
			usernameField: 'email',
			passwordField: 'password'
		},
		function(username, password, done) {
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
					var msg = { message: 'Unknown user or invalid password' };
					return done(null, user, msg);
				}

				return done(null, user);
			});
		}
	));
};