'use strict';

/**
 * Module dependencies.
 */
var passport 			= require('passport');
var config				= require('config');
var FacebookStrategy 	= require('passport-facebook').Strategy;
var users 				= require('../../rest/controllers/userController');
var models				= require('../../models/models');

module.exports = function() {
	// Use facebook strategy
	console.log("facebook");
	passport.use(new FacebookStrategy({
			clientID: config.facebook.appID,
			clientSecret: config.facebook.appSecret,
			callbackURL: config.facebook.callbackURL,
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
				firstName: profile.name.givenName,
				lastName: profile.name.familyName,
				displayName: profile.displayName,
				email: profile.emails[0].value,
				username: profile.username,
				provider: 'facebook',
				providerIdentifierField: 'id',
				providerData: providerData
			};

			// Save the user OAuth profile
			users.saveOAuthUserProfile(req, providerUserProfile, done);
		}
	));
};