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
}