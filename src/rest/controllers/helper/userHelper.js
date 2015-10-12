/**
 * Created by randy on 11/21/14.
 */
var model                   = require('../../../models/models');
var profileHelper           = require('./profileHelper');
var config                  = require('config');
var jwt                     = require('jwt-simple');
var moment                  = require('moment');
var config                  = require('config');

exports.userHasOAuthProvider = function( user, provider ) {
    for(var i=0; i < user.credentials.oauth.length; i++) {
        if (user.credentials.oauth[i].provider === provider) {
            return true;
        }
    }
    return false;
};

exports.updateProviderCode = function( user, provider, code ) {
    for(var i=0; i < user.credentials.oauth.length; i++) {
        if (user.credentials.oauth[i].provider === provider) {
            user.credentials.oauth[i].code = code;
            return true;
        }
    }
    return false;
};

exports.validateOAuthId = function( user, provider, profile, providerData ) {
    for(var i=0; i < user.credentials.oauth.length; i++) {
        if (user.credentials.oauth[i].provider === provider) {
            if (user.credentials.oauth[i].providerData[profile.providerIdentifierField] === providerData[profile.providerIdentifierField]) {
                return true;
            }
            else {
                return false;
            }
        }
    }
    return false;
};

exports.newUserFromOAuth = function( providerUserProfile, callback ) {
    var info = {};
    info.name = providerUserProfile.email;
    info.label = providerUserProfile.displayName;
    info.email = providerUserProfile.email;
    info.firstName = providerUserProfile.firstName;
    info.lastName = providerUserProfile.lastName;
    info.name = providerUserProfile.displayName;

    exports.newUserFromLocal(info,function(err,user){
        var pData = {};

        pData.provider = providerUserProfile.provider;
        pData.providerData = providerUserProfile.providerData;
        pData.code = providerUserProfile.providerData.code;
        user.credentials.oauth.push(pData);

        // And save the user
        user.save(function (err, u) {
            callback(err, u);
        });
    });
};

exports.newUserFromLocal = function( body, callback ) {

    var user = new model.User();
    var possibleName = body.email.split('@');

    user.email = body.email;
    user.public.firstName = body.firstName ? body.firstName : possibleName[0];
    user.public.lastName = body.lastName ? body.lastName : possibleName[1];
    user.public.name = body.name ? body.name : possibleName[0] + ' ' + possibleName[1];
    user.public.displayName = user.public.name;
    user.credentials.password = body.password;

    var profileInfo = {};
    profileInfo.displayName = user.public.displayName;
    profileInfo.userName = user.email;
    profileInfo.enterprise = user.enterprise;

    profileHelper.newProfile( profileInfo,function( err, p){
        p.save(function( err, profile) {

            user.profile[0] = profile._id;

            callback(null,user);
        });
    });
};

exports.newUserFromApiKey = function( body, callback ) {
    var fakeEmail = config.users.fakeEmail;
    var user = new model.User();

    var token = validate(body.key, config.jwt.apikeysecret);

    if (body.id.indexOf('@') === -1){
        user.email = body.id + '@' + body.enterprise + '.' + fakeEmail;
    } else {
        user.email = body.id;
    }

    user.public.name = body.enterprise + ': ' + body.id;
    user.public.firstName = body.enterprise;
    user.public.lastName = body.id;
    user.enterprise = token.aud;
    user.enterpriseId = token.jti;
    user.originalId = body.id;

    var profileInfo = {};
    profileInfo.originalId = user.originalId;
    profileInfo.userName = user.email;
    profileInfo.enterprise = body.enterprise;
    profileInfo.enterpriseId = body.enterpriseId;

    profileHelper.newProfile( profileInfo,function( err, p){
        p.save(function( err, profile) {

            user.profile[0] = profile._id;

            callback(null,user);
        });
    });
};

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