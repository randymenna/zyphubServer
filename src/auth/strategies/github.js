(function() {
	'use strict';
}());
/**
 * Module dependencies.
 */
var passport 			= require('passport');
var config				= require('config');
var GithubStrategy 		= require('passport-github').Strategy;
var users 				= require('../../rest/controllers/userController');
var models				= require('../../models/models');

module.exports = function() {
	// Use github strategy
	console.log('github');
	passport.use(new GithubStrategy({
			clientID: config.github.clientID,
			clientSecret: config.github.clientSecret,
			callbackURL: config.github.callbackURL,
			passReqToCallback: true
		},
		function(req, accessToken, refreshToken, profile, done) {
			// Set the provider data and include tokens

			var providerData = profile._json;
			providerData.accessToken = accessToken;
			providerData.refreshToken = refreshToken;
			providerData.code = req.query.code;

			// Create the user OAuth profile
			var providerUserProfile = {
				displayName: profile.displayName,
				email: profile.emails[0].value,
				username: profile.username,
				provider: 'github',
				providerIdentifierField: 'id',
				providerData: providerData,
				code: req.query.code
			};

			// Save the user OAuth profile
			users.saveOrValidateOAuthUserProfile(req, providerUserProfile, done);
		}
	));
};