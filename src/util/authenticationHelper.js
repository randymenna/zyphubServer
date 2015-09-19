/**
 * Created by
 */
var jwt 					                = require('jwt-simple');
var config                                  = require('config');
var moment                                  = require('moment');

var AuthenticationHelper = module.exports = function AuthenticationHelper() {
};

AuthenticationHelper.prototype.validateToken = function(token) {
    var decoded = null;

    try {
        decoded = jwt.decode( token, config.jwt.secret );
        console.log('AuthenticationHelper.authenticate(): ' + JSON.stringify(decoded));
        if ( decoded.exp ) {
            var now = moment();
            var expires = moment.unix(decoded.exp);
            if ( now.isAfter(expires) ) {
                decoded = null;
            }
        }
    }
    catch( e ) {
        console.log('AuthenticationHelper.authenticate(): %s',e);
    }

    return decoded;
};

AuthenticationHelper.prototype.validate = function(token,secret) {
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
        console.log('AuthenticationHelper.validate(): %s',e);
    }
    return decoded;
};

AuthenticationHelper.prototype.createToken = function( profileId, body, secret, options ) {
    var expiration = 0;

    if ( options.expiresInMinutes ) {
        expiration = moment().add(options.expiresInMinutes, 'minutes').toISOString();
    }

    var claims = {
        'iss': 'conversepoint.com',
        'iat':  Math.round(+new Date()/1000),
        'exp':  Math.round(+new Date()/1000) + 31536000,    // 1 year
        'sub': 'profile id',
        'aud': body.enterprise,
        'jti': body.enterpriseId,
        'pid': profileId
    };

    var token = jwt.encode(claims,secret);

    return token;
};

