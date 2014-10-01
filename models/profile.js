/**
 * Created by randy on 9/29/14.
 */
var mongoose                = require('mongoose');


var Schema  = mongoose.Schema;

var entitySchema = new Schema({
    id:     Schema.Types.ObjectId,
    name:   String,
    label:  String,
    avatar: String,
    role:   String
});

var personSchema = new Schema({
    entity: {
        id:     Schema.Types.ObjectId,
        name:   String,
        label:  String,
        avatar: String,
        role:   String,
        presence: {type: String, default: "OFFLINE"}
    },
    type: String,
    memberOf:  [groupSchema],
    friends: [ {type: Schema.Types.ObjectId, ref: '_Person'}]
});

var groupSchema = new Schema({
    entity: {
        id:     Schema.Types.ObjectId,
        name:   String,
        label:  String,
        avatar: String,
        role:   String,
        presence: { type: String, default: "Unknown"}
    },
    type:       String,
    members:    [entitySchema],
    owner:      [entitySchema]
});

var _Person = mongoose.model('Person', personSchema);
var _Group = mongoose.model('Group', groupSchema);


module.exports =  {
    Person : _Person,
    Group : _Group
};


