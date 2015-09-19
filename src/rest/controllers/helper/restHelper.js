/**
 * Created by randy on 11/12/14.
 */
var mongoose                = require('mongoose');

exports.extractOriginId = function(req) {
    var token      = req.headers['cp-auth-token'];

    return decodeToken(token);
};

var decodeToken = function( token ) {
    return token;
};

