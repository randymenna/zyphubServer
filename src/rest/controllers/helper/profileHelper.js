/**
 * Created by randy on 11/18/14.
 */
var model                   = require('../../../models/models');
var mongoose                = require('mongoose');
var tagHelper               = require('./tagHelper');

exports.newProfile = function( info, callback ) {
    var stringId = mongoose.Types.ObjectId().toHexString();
    stringId = 'a' + stringId.substring(1);
    var _id = mongoose.Types.ObjectId( stringId );

    info._id = _id;

    var p = new model.Profile(info);

    // create a default tag
    var defaultTag = {}
    defaultTag.context = info.userName;
    defaultTag.enterprise = info.enterprise;
    defaultTag.owner = [ info._id ];

    var t = tagHelper.newTag( defaultTag );

    t.save(function( err, tag){
        if ( err ) {
            console.log("newProfile(): Error: cannot save default tag %s",defaultTag.label);
        }
        callback( err, p );
    });
};

exports.sanitize = function( profile ) {

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