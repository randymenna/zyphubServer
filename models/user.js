'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	crypto = require('crypto');

/**
 * A Validation function for local strategy properties
 */
var validateLocalStrategyProperty = function(property) {
	return ((this.provider !== 'local' && !this.updated) || property.length);
};

/**
 * A Validation function for local strategy password
 */
var validateLocalStrategyPassword = function(password) {
	return (this.provider !== 'local' || (password && password.length > 6));
};

/**
 * User Schema
 */
var UserSchema = new Schema({
	email: {
		type: String,
		trim: true,
		unique: true,
		match: [/.+\@.+\..+/, 'Please fill a valid email address'],
		required: true,
		validate: [validateLocalStrategyProperty, 'Email address required'],
		index: true
	},
	// bearer auth
	token: { type: String },

	profile: [{type: Schema.Types.ObjectId, ref: 'Profile'}],

	public: {
		firstName: { type: String, trim: true, default: ''},
		lastName: { type: String, trim: true, default: ''},
		name: { type: String, trim: true, default: ''},
		displayName: { type: String, trim: true}
	},

	credentials: {
		salt: { type: String},
		password: {
			type: String,
			default: '',
			validate: [validateLocalStrategyPassword, 'Password should be longer']
		},
		oauth: [{
			provider: { type: String },
			providerData: {},
			additionalProvidersData: {},
			code: { type: String, index: true }
		}]
	},

	roles: {
		type: [{
			type: String,
			enum: ['user', 'admin']
		}],
		default: ['user']
	},

	lastLogin: { type: Date },
	created: { type: Date, default: Date.now },

	/* For reset password */
	resetPasswordToken: { type: String},
  	resetPasswordExpires: { type: Date}
});


/**
 * Hook a pre save method to hash the password
 */
UserSchema.pre('save', function(next) {
	if (this.credentials.password && this.credentials.password.length > 6) {
		this.credentials.salt = new Buffer(crypto.randomBytes(16).toString('base64'), 'base64');
		this.credentials.password = this.hashPassword(this.credentials.password);
	}
	this.lastLogin = new Date();

	next();
});

/**
 * Create instance method for hashing a password
 */
UserSchema.methods.hashPassword = function(password) {
	if (this.credentials.salt && password) {
		return crypto.pbkdf2Sync(password, this.credentials.salt, 10000, 64).toString('base64');
	} else {
		return password;
	}
};

/**
 * Create instance method for authenticating user
 */
UserSchema.methods.authenticate = function(password) {
	return this.credentials.password === this.hashPassword(password);
};

/**
 * Find possible not used username
 */
UserSchema.statics.findUniqueUsername = function(username, suffix, callback) {
	var _this = this;
	var possibleUsername = username + (suffix || '');

	_this.findOne({
		username: possibleUsername
	}, function(err, user) {
		if (!err) {
			if (!user) {
				callback(possibleUsername);
			} else {
				return _this.findUniqueUsername(username, (suffix || 0) + 1, callback);
			}
		} else {
			callback(null);
		}
	});
};

var User = mongoose.model('User', UserSchema);

module.exports =  {
	User : User
};