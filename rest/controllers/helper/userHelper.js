/**
 * Created by randy on 11/21/14.
 */
var model                   = require('../../../models/models');
var profileHelper           = require('./profileHelper');

exports.userHasOAuthProvider = function( user, provider ) {
    for(var i=0; i < user.credentials.oauth.length; i++) {
        if (user.credentials.oauth[i].provider == provider) {
            return true;
        }
    }
    return false;
}

exports.updateProviderCode = function( user, provider, code ) {
    for(var i=0; i < user.credentials.oauth.length; i++) {
        if (user.credentials.oauth[i].provider == provider) {
            user.credentials.oauth[i].code = code;
            return true;
        }
    }
    return false;
}

exports.validateOAuthId = function( user, provider, profile, providerData ) {
    for(var i=0; i < user.credentials.oauth.length; i++) {
        if (user.credentials.oauth[i].provider == provider) {
            if (user.credentials.oauth[i].providerData[profile.providerIdentifierField] == providerData[profile.providerIdentifierField])
                return true;
            else
                return false;
        }
    }
    return false;
}

exports.sanitizeUser = function( u ) {
    if ( u ) {
        u._id = undefined;
        u.__v = undefined;
        u.credentials = undefined;
        u.roles = undefined;
        u.created = undefined;
        u.updated = undefined;
        u.lastLogin = undefined;
        u.resetPasswordToken = undefined;
        u.resetPasswordExpires = undefined;
    }

    return u;
}

exports.sanitize = function( user ) {


    function clean( u ) {

        delete u.__v;
        delete u.token;
        delete u.roles;
        delete u.credentials;
        return u;
    }

    if ( user instanceof Array )
        for(var i=0; i < user.length; i++ ) {
            user[i] = clean( user[i].toObject());
        }
    else
    if (user)
        user = clean(user.toObject());

    return user;
};

exports.newUserFromOAuth = function( providerUserProfile, callback ) {
    var info = {}
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
}

exports.newUserFromLocal = function( body, callback ) {

    var user = new model.User();
    var possibleName = body.email.split('@');

    user.email = body.email;
    user.public.firstName = body.firstName ? body.firstName : possibleName[0];
    user.public.lastName = body.lastName ? body.lastName : possibleName[1];
    user.public.name = body.name ? body.name : possibleName[0] + " " + possibleName[1];
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
}