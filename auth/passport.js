'use strict';

var _			= require('lodash');


//var passport = require('passport'),
var User = require('../models/models').User,
	path = require('path');

module.exports = function(passport) {


	// Serialize sessions
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	// Deserialize sessions
	passport.deserializeUser(function(id, done) {
		User.findOne({
			_id: id
		}, { password: -1, salt: -1 }, function(err, user) {
			done(err, user);
		});
	});


	require('./strategies/local')(passport);
	require('./strategies/bearer')(passport);
	require('./strategies/github')(passport);
	require('./strategies/facebook')(passport);
};
