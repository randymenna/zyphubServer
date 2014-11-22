'use strict';

var model                   = require('../../../models/models');
var profileHelper			= require('../../../rest/controllers/helper/profileHelper');
var jwt 					= require('jsonwebtoken');

/**
 * Module dependencies.
 */
var _ = require('lodash'),
	errorHandler = require('../errors'),
	mongoose = require('mongoose'),
	passport = require('passport');

/**
 * Signup
 */
exports.signup = function(req, res) {
	// For security measurement we remove the roles from the req.body object
	delete req.body.roles;

	// Init Variables
	var user = new model.User(req.body);
	var message = null;

	// Add missing user fields
	user.provider = 'local';
	user.displayName = user.firstName + ' ' + user.lastName;

	var info = {}
	info.name = user.email;
	info.label = user.displayName;

	var p = profileHelper.newProfile(info);

	p.save(function( err, profile){

		user.profile = []
		user.profile[0] = profile._id;

		// Then save the user
		user.save(function(err) {
			if (err) {
				return res.status(400).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				// Remove sensitive data before login
				user.password = undefined;
				user.salt = undefined;

				req.login(user, function(err) {
					if (err) {
						res.status(400).send(err);
					} else {
						res.jsonp(user);
					}
				});
			}
		});
	});
};

/**
 * Signin after passport authentication
 */
exports.signin = function(req, res, next) {

	if ( req.body.provider == 'local' )
		passport.authenticate('local', {session: false}, function(err, user, info) {
			if (err) {
				res.status(400).send(info);
			} else
			if (!user) {
				newUserFromLocal( req.body, function(err, user){
					req.login(user, function(err) {
						if (err) {
							res.status(400).send(err);
						} else {

							user.token = jwt.sign({ profile:user.profile[0] }, 'this-is-the-secret-key',{expiresInMinutes: 5});

							user.save(function( err, u){
								res.json(sanitizeUser(u));
							});

						}
					});
				});
			}
			else {
				req.login(user, function(err) {
					if (err) {
						res.status(400).send(err);
					} else {

						user.token = jwt.sign({ profile:user.profile[0] }, 'this-is-the-secret-key',{expiresInMinutes: 5});

						user.save(function( err, u){
							res.json(sanitizeUser(u));
						});

					}
				});
			}
		})(req, res, next);

	if ( req.body.provider == 'github' )
		passport.authenticate('github', {session: false}, function(err, user, info) {
			if (err || !user) {
				res.status(400).send(info);
			} else {
				// Remove sensitive data before login
				//user.password = undefined;
				//user.salt = undefined;

				req.login(user, function(err) {
					if (err) {
						res.status(400).send(err);
					} else {

						user.token = jwt.sign({ profile:user.profile[0] }, 'this-is-the-secret-key',{expiresInMinutes: 5});

						user.save(function( err, u){
							res.json(sanitizeUser(u));
						});
					}
				});
			}
		})(req, res, next);
};

/**
 * Signout
 */
exports.signout = function(req, res) {
	req.logout();
	var o = {};
	o.status = "logout ok";
	res.jsonp(o);
};

/**
 * OAuth callback
 */
exports.oauthCallback = function(strategy) {
	return function(req, res, next) {
		passport.authenticate(strategy, function(err, user, redirectURL) {
			if (err) {
				res.status(400).send(err);
			} else {
				var searchQuery = { 'providerData.code' : req.query.code };

				model.User.findOne({'credentials.oauth': {$elemMatch: {code: req.query.code}}}, function (err, user) {

					req.login(user, function (err) {
						if (err) {
							res.status(400).send({error: err});
						}
						else
						if (!user) {
							res.status(401).send({error: "oauth callback mismatch"});
						}
						else {
							user.token = jwt.sign({profile: user.profile[0]}, 'this-is-the-secret-key', {expiresInMinutes: 5});
							user.save(function (err, u) {

								res.status(200).json(sanitizeUser(u));
							});
						}
					});
				});
			}
		})(req, res, next);
	};
};

var userHasOAuthProvider = function( user, provider ) {
	for(var i=0; i < user.credentials.oauth.length; i++) {
		if (user.credentials.oauth[i].provider == provider) {
			return true;
		}
	}
	return false;
}

var updateProviderCode = function( user, provider, code ) {
	for(var i=0; i < user.credentials.oauth.length; i++) {
		if (user.credentials.oauth[i].provider == provider) {
			user.credentials.oauth[i].code = code;
			return true;
		}
	}
	return false;
}

var validateOAuthId = function( user, provider, profile, providerData ) {
	for(var i=0; i < user.credentials.oauth.length; i++) {
		if (user.credentials.oauth[i].provider == provider) {
			if (user.credentials.oauth[i].providerData[profile.providerIdentifierField] == providerData[profile.providerIdentifierField])
				return true;
			else
				return false;
		}
	}
	return false;
}

var sanitizeUser = function( u ) {
	u._id = undefined;
	u.__v = undefined;
	u.credentials = undefined;
	u.roles = undefined;
	u.created = undefined;
	u.updated = undefined;

	return u;
}

var newUserFromOAuth = function( providerUserProfile, callback ) {
	var info = {}
	info.name = providerUserProfile.email;
	info.label = providerUserProfile.displayName;

	var p = profileHelper.newProfile(info);

	p.save(function( err, profile) {

		var user = new model.User();

		user.email = providerUserProfile.email;
		user.profile[0] = profile._id;
		user.public.firstName = providerUserProfile.firstName;
		user.public.lastName = providerUserProfile.lastName;
		user.public.name = providerUserProfile.displayName;
		user.public.displayName = providerUserProfile.displayName;

		var pData = {};

		pData.provider = providerUserProfile.provider;
		pData.providerData = providerUserProfile.providerData;
		pData.code = providerUserProfile.providerData.code;
		user.credentials.oauth.push(pData);

		// And save the user
		user.save(function (err, u) {
			callback(err, u);
		});
	});
}

var newUserFromLocal = function( body, callback ) {

	var possibleName = body.email.split('@');

	var info = {}
	info.name = body.email;
	info.label = possibleName[0];

	var p = profileHelper.newProfile(info);

	p.save(function( err, profile) {

		var user = new model.User();

		user.email = body.email;
		user.profile[0] = profile._id;
		user.public.firstName = body.firstName ? body.firstName : possibleName[0];
		user.public.lastName = body.lastName ? body.lastName : possibleName[1];
		user.public.name = body.name ? body.name : possibleName[0] + " " + possibleName[1];
		user.public.displayName = user.public.name;
		user.credentials.password = body.password;

		// And save the user
		user.save(function (err, u) {
			callback(err, u);
		});
	});
}

/**
 * Helper function to save or update a OAuth user profile
 */
exports.saveOAuthUserProfile = function(req, providerUserProfile, done) {

	var provider = providerUserProfile.provider;
	var searchQuery = { email: providerUserProfile.email };

	model.User.findOne(searchQuery, function(err, user) {
		if (err) {
			return done(err);
		} else {
			if (!user) {

				// And save the user
				newUserFromOAuth(providerUserProfile, function (err, user) {
					return done(err, user);
				});

			} else {
				// user logging in with existing oauth provider
				if ( userHasOAuthProvider( user, provider ) ) {
					// validate the user
					if (validateOAuthId(user,provider,providerUserProfile,providerUserProfile.providerData)) {
						updateProviderCode( user, provider, providerUserProfile.providerData.code );
						user.save(function(err){
							return done(err, user);
						});
					}
					else {
						return done(null, false);
					}
				}
				else {
					var pData = {};

					pData.provider = providerUserProfile.provider;
					pData.providerData = providerUserProfile.providerData;
					user.credentials.oauth.push(pData);
					updateProviderCode( user, provider, providerUserProfile.providerData.code );

					user.save(function(err){
						return done(err, user);
					});
				}
			}
		}
	});
};

/**
 * Remove OAuth provider
 */
exports.removeOAuthProvider = function(req, res, next) {
	var user = req.user;
	var provider = req.param('provider');

	if (user && provider) {
		// Delete the additional provider
		if (user.additionalProvidersData[provider]) {
			delete user.additionalProvidersData[provider];

			// Then tell mongoose that we've updated the additionalProvidersData field
			user.markModified('additionalProvidersData');
		}

		user.save(function(err) {
			if (err) {
				return res.status(400).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				req.login(user, function(err) {
					if (err) {
						res.status(400).send(err);
					} else {
						res.jsonp(user);
					}
				});
			}
		});
	}
};