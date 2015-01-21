/**
 * Created by
 */
var jwt 					                = require('jwt-simple');
var config                                  = require('config');
var moment                                  = require('moment');

var AuthenticationHelper = module.exports = function AuthenticationHelper() {
}

AuthenticationHelper.prototype.validateToken = function(token) {
    var decoded = null;

    try {
        decoded = jwt.decode( token, config.jwt.secret );
        console.log("AuthenticationHelper.authenticate(): " + JSON.stringify(decoded));
        if ( decoded.expiration ) {
            var now = moment();
            var expires = moment(decoded.expires);
            if ( now.isAfter(expires) )
                decoded = null;
        }
    }
    catch( e ) {
        console.log("AuthenticationHelper.authenticate(): %s",e);
    }

    // TODO: validate the profile id decoded

    return decoded;
};

AuthenticationHelper.prototype.createToken = function( profileId, secret, options ) {
    var expiration = 0;

    if ( options.expiresInMinutes )
        expiration = moment().add(options.expiresInMinutes,'minutes').toISOString();

    var payload = {};
    payload.profileId = profileId;
    payload.expiration = expiration;

    var token = jwt.encode(payload,secret);

    return token;
}

