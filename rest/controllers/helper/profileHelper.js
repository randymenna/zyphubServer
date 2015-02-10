/**
 * Created by randy on 11/18/14.
 */
var model                   = require('../../../models/models');
var mongoose                = require('mongoose');

exports.newProfile = function( info ) {
    var stringId = mongoose.Types.ObjectId().toHexString();
    stringId = 'a' + stringId.substring(1);
    var _id = mongoose.Types.ObjectId( stringId );

    info._id = _id;

    var p = new model.Profile(info);

    return p;
};

exports.santize = function( profile ) {

    delete profile.__v;
    delete profile.meta;
    delete profile.friends;
    delete profile.public;
    delete profile.type;
    delete profile.role;
    delete profile.avatar;

    return profile;
};

exports.getUpdate = function( body ) {
    var update = {};

    if (body.displayName)
        update.displayName = body.displayName;

    if (body.memberOf)
        update.memberOf = body.memberOf;

    if (body.enterprise)
    update.enterprise = body.enterprise;

    return update;
};