'use strict';

var model                   = require('../../../models/models');
var profileHelper			= require('../helper/profileHelper');
var userHelper				= require('../helper/userHelper');
var AuthHelper				= require('../../../util/authenticationHelper');
var config					= require('config');

/**
 * Module dependencies.
 */
var _ = require('lodash'),
	errorHandler = require('../errors'),
	mongoose = require('mongoose'),
	passport = require('passport');

var authHelper = new AuthHelper();

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
	info.user = user.email;
	info.displayName = user.displayName;

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

exports.authByKey = function(req, res, next){

    passport.authenticate('conversepoint', {session: false}, function(err, user, info) {
        if (err) {
            res.status(400).send(info);
        } else
        if (!user) {
            if ( !req.body.id ) {
                res.status(400).send(info);
            }
            else {
                userHelper.newUserFromApiKey(req.body, function (err, user) {
                    req.login(user, function (err) {
                        if (err) {
                            res.status(400).send(err);
                        }
                        else {

                            user.token = authHelper.createToken(user.profile[0], req.body.enterprise, config.jwt.secret, {expiresInMinutes: config.jwt.ttl});

                            user.save(function (err, u) {
                                if (err){
                                    res.status(400).json(err);
                                }
                                else {
                                    res.json(userHelper.sanitizeForGraph(u));
                                }
                            });

                        }
                    });
                });
            }
        }
        else {

            if ( info ) {
                res.status(400).send(info);
            }
            else {
                user.credentials.password = req.body.password;
                user.token = authHelper.createToken(user.profile[0], req.body.enterprise, config.jwt.secret, {expiresInMinutes: config.jwt.ttl});

                user.save(function (err, u) {
                    res.json(userHelper.sanitizeForGraph(u));
                });
            }
        }
    })(req, res, next);
};

/**
 * Signin after passport authentication
 */
exports.signin = function(req, res, next) {

    if ( req.body.provider == 'local' ) {
        passport.authenticate('local', {session: false}, function (err, user, info) {
            if (err) {
                res.status(400).send(info);
            }
            else if (!user) {
                if (!req.body.email || !req.body.password) {
                    res.status(400).send(info);
                }
                else {
                    userHelper.newUserFromLocal(req.body, function (err, user) {
                        req.login(user, function (err) {
                            if (err) {
                                res.status(400).send(err);
                            }
                            else {

                                user.token = authHelper.createToken(user.profile[0], req.body.enterprise, config.jwt.secret, {expiresInMinutes: config.jwt.ttl});

                                user.save(function (err, u) {
                                    res.json(userHelper.sanitizeUser(u));
                                });

                            }
                        });
                    });
                }
            }
            else {

                if (info) {
                    res.status(400).send(info);
                }
                else {
                    user.credentials.password = req.body.password;
                    user.token = authHelper.createToken(user.profile[0], req.body.enterprise, config.jwt.secret, {expiresInMinutes: config.jwt.ttl});

                    user.save(function (err, u) {
                        res.json(userHelper.sanitizeUser(u));
                    });
                }
            }
        })(req, res, next);
    }
    else
	if ( req.body.provider == 'github' ) {
        passport.authenticate('github', {session: false}, function (err, user, info) {
            if (err || !user) {
                res.status(400).send(info);
            }
            else {

                user.token = authHelper.createToken(user.profile[0], req.body.enterprise, config.jwt.secret, {expiresInMinutes: config.jwt.ttl});

                user.save(function (err, u) {
                    res.json(userHelper.sanitizeUser(u));
                });
            }
        })(req, res, next);
    }
    else
	if ( req.body.provider == 'google' ) {
        passport.authenticate('google', {
            scope: [
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email'
            ]
        }, function (err, user, info) {
            if (err || !user) {
                res.status(400).send(info);
            }
            else {

                user.token = authHelper.createToken(user.profile[0], req.body.enterprise, config.jwt.secret, {expiresInMinutes: config.jwt.ttl});

                user.save(function (err, u) {
                    res.json(userHelper.sanitizeUser(u));
                });
            }
        })(req, res, next);
    }
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
							// TODO: make this configurable
							// user.token = authHelper.createToken(user.profile[0], config.jwt.secret,{expiresInMinutes: config.jwt.ttl});

							user.token = authHelper.createToken(user.profile[0], req.body.enterprise, config.jwt.secret,{});

							user.save(function (err, u) {

								res.status(200).json(userHelper.sanitizeUser(u));
							});
						}
					});
				});
			}
		})(req, res, next);
	};
};

/**
 * Helper function to save or update a OAuth user profile
 */
exports.saveOrValidateOAuthUserProfile = function(req, providerUserProfile, done) {

	var provider = providerUserProfile.provider;
	var searchQuery = { email: providerUserProfile.email };

	model.User.findOne(searchQuery, function(err, user) {
		if (err) {
			return done(err);
		} else {
			if (!user) {

				// And save the user
				userHelper.newUserFromOAuth(providerUserProfile, function (err, user) {
					return done(err, user);
				});

			} else {
				// user logging in with existing oauth provider
				if ( userHelper.userHasOAuthProvider( user, provider ) ) {
					// validate the user
					if (userHelper.validateOAuthId(user,provider,providerUserProfile,providerUserProfile.providerData)) {
						userHelper.updateProviderCode( user, provider, providerUserProfile.providerData.code );
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
					userHelper.updateProviderCode( user, provider, providerUserProfile.providerData.code );

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