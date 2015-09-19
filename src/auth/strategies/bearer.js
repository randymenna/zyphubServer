/**
 * Created by randy on 11/19/14.
 */
var BearerStrategy              = require('passport-http-bearer').Strategy;
var User                        = require('mongoose').model('User');
var AuthHelper				    = require('../../util/authenticationHelper');

var authHelper = new AuthHelper();

module.exports = function(passport) {
    console.log('bearer');

    passport.use(new BearerStrategy({},
        function (token, done) {
            //console.log('bearer');
            User.findOne({
                token: token
            },function(err, user) {
                if (err) {
                    return done(err);
                }

                if (!user) {
                    return done(null, false);
                }

                var decoded = authHelper.validateToken( token );

                if (!decoded) {
                    return done(Error('Invalid Bearer token'), false);
                }
                else {
                    user.origin = decoded.pid;
                    user.enterprise = decoded.aud;
                    user.enterpriseId = decoded.jti;

                    return done(null, user);
                }

            });
        }
    ));
};