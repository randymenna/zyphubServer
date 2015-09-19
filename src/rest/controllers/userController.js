'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash');

/**
 * Extend user's controller
 */
module.exports = _.extend(
	require('./users/users.authentication.controller.js'),
	require('./users/users.authorization.controller.js'),
	require('./users/users.password.controller.js'),
	require('./users/users.profile.controller.js')
);