/**
 * Created by randy on 9/29/14.
 */
var mongoose                = require('mongoose');
var conversation            = require('./conversation');

var Schema  = mongoose.Schema;

var entitySchema = new Schema({
    id:     Schema.Types.ObjectId,
    name:   String,
    label:  String,
    avatar: String,
    role:   String
});

var groupSchema = new Schema({

    name:   String,
    label:  String,
    avatar: {type: String, default: "group.png"},

    type:       { type: String, default: "GROUP" },
    members:    [personSchema],
    owner:      [personSchema]
});

var personSchema = new Schema({

    name:   String,
    label:  String,
    avatar: {type: String, default: "default.png"},
    role:   {type: String, default: "USER"},
    presence: {type: String, default: "OFFLINE"},

    type: { type: String, default: "PERSON" },
    memberOf:  [groupSchema],
    friends: [ {type: Schema.Types.ObjectId, ref: 'Person'}],
    inbox: [ {type: Schema.Types.ObjectId, ref: 'Conversation'}]
});

var _Person = mongoose.model('Person', personSchema);
var _Group = mongoose.model('Group', groupSchema);


module.exports =  {
    Person : _Person,
    Group : _Group
};


