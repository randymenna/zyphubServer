/**
 * Created by randy on 9/29/14.
 */
var mongoose                = require('mongoose');
var conversation            = require('./conversation');

var Schema  = mongoose.Schema;

var groupSchema = new Schema({
    _id:            {type: Schema.Types.ObjectId},
    name:           String,
    label:          String,
    description:    String,
    avatar:         {type: String, default: "group.png"},
    type:           {type: String, default: "GROUP"},
    public:         {type: Boolean, default: false},
    enterprise:     {type: String, default: "ConversePoint"},
    members:        [{type: Schema.Types.ObjectId, ref: 'Person'}],
    owner:          [{type: Schema.Types.ObjectId, ref: 'Person'}]
},
    {autoIndex: false});

var _Group = mongoose.model('Group', groupSchema);


module.exports =  {
    Group : _Group
};


