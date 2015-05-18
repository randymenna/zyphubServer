'use strict';

/**
 * Module dependencies.
 */
var config = require('config');
var	CPStrategy = require('../custom/passport-conversepoint');
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
                if ( now.isAfter(expires) )
                    decoded = null;
            }
        }
        catch( e ) {
            console.log("validate(): %s",e);
        }
        return decoded;
    };


    passport.use(new CPStrategy({
            passReqToCallback: true
		},
		function(req, id, key, done) {

            var token = validate(key, config.jwt.apikeysecret);

            if (!token){
                var msg = { message: 'Invalid ConversePoint API Key' };
                return done(null, null, msg);
            }
            else {
                User.findOne({
                    email: id + fakeEmail
                },function(err, user) {
                    req.body.enterprise = token.aud;

                    if (err) {
                        return done(err);
                    }
                    if (!user) {
                        return done(null, false, {
                            message: 'Unknown user'
                        });
                    }

                    return done(null, user);
                });
            }
		}
	));
};