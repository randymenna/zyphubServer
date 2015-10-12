(function() {
    'use strict';
}());
/**
 * Module dependencies.
 */
var config = require('config');
var	CPStrategy = require('../custom/passport-conversepoint');
var	LocalStrategy = require('passport-local').Strategy;
var User = require('mongoose').model('User');
var jwt  = require('jwt-simple');
var moment = require('moment');


var fakeEmail = config.users.fakeEmail;

module.exports = function(passport) {
    console.log('apikey');

    var validate = function(token,secret) {
        var decoded = null;

        try {
            decoded = jwt.decode( token, secret );
            if ( decoded.exp ) {
                var now = moment();
                var expires = moment(decoded.expires);
                if ( now.isAfter(expires) ) {
                    decoded = null;
                }
            }
        }
        catch( e ) {
            console.log('validate(): %s',e);
        }
        return decoded;
    };

/*
    passport.use(new CPStrategy({
            passReqToCallback: true
		},
		*/
    passport.use('apiKey', new LocalStrategy({
            usernameField: 'id',
            passwordField: 'key',
            passReqToCallback: true
        },
		function(req, id, key, done) {

            var token = validate(key, config.jwt.apikeysecret);

            if (!token){
                var msg = { message: 'Invalid ConversePoint API Key' };
                return done(msg, null, msg);
            }
            else {
                User.findOne({
                    email: id + fakeEmail
                },function(err, user) {
                    req.body.enterprise = token.aud;
                    req.body.enterpriseId = token.jti;

                    if (user) {
                        user.enterprise = token.aud;
                        user.enterpriseId = token.jti;
                    }

                    if (err) {
                        return done(err);
                    }
                    if (!user) {
                        return done(null, null, null);
                    }

                    return done(null, user);
                });
            }
		}
	));
};