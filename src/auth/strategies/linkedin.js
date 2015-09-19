(function() {
	'use strict';
}());
/**
 * Module dependencies.
 */

var passport 			= require('passport');
var config				= require('config');
var LinkedInStrategy 	= require('passport-linkedin').Strategy;
var users 				= require('../../rest/controllers/userController');
var models				= require('../../models/models');

module.exports = function() {
	// Use linkedin strategy
	passport.use(new LinkedInStrategy({
			consumerKey: config.linkedin.clientID,
			consumerSecret: config.linkedin.clientSecret,
			callbackURL: config.linkedin.callbackURL,
			passReqToCallback: true,
			profileFields: ['id', 'first-name', 'last-name', 'email-address']
		},
		function(req, accessToken, refreshToken, profile, done) {
			// Set the provider data and include tokens
			var providerData = profile._json;
			providerData.accessToken = accessToken;
			providerData.refreshToken = refreshToken;
			providerData.code = req.query.code;

			// Create the user OAuth profile
			var providerUserProfile = {
				firstName: profile.name.givenName,
				lastName: profile.name.familyName,
				displayName: profile.displayName,
				email: profile.emails[0].value,
				username: profile.username,
				provider: 'linkedin',
				providerIdentifierField: 'id',
				providerData: providerData,
				code: req.query.code
			};

			// Save the user OAuth profile
			users.saveOrValidateOAuthUserProfile(req, providerUserProfile, done);
		}
	));
};