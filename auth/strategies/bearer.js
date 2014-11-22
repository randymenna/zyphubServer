/**
 * Created by randy on 11/19/14.
 */
var BearerStrategy              = require('passport-http-bearer').Strategy;
var User                        = require('mongoose').model('User');
var jwt 					    = require('jsonwebtoken');

module.exports = function(passport) {

    passport.use(new BearerStrategy({},
        function (token, done) {
            console.log("bearer");
            User.findOne({
                token: token
            },function(err, user) {
                if (err) {
                    return done(err);
                }

                if (!user) {
                    return done(null, false);
                }

                jwt.verify(token, 'this-is-the-secret-key', function(err, decoded) {
                    if (err) {
                        return done(null, false);
                    }
                    else {
                        user.origin = decoded.profile;

                        return done(null, user);
                    }
                });

            });
        }
    ));
}