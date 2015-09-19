/**
 * Created by randy on 9/29/14.
 */
var mongoose                = require('mongoose');

var Schema  = mongoose.Schema;

var profileSchema = new Schema({
    _id:            {type: Schema.Types.ObjectId},
    user:           String,
    displayName:    String,
    avatar:         {type: String, default: 'default.png'},
    role:           {type: String, default: 'USER'},
    presence:       {type: String, default: 'OFFLINE'},
    type:           {type: String, default: 'PERSON'},
    public:         {type: Boolean, default: false},
    enterprise:     {type: String, default: 'ConversePoint'},
    enterpriseId:   {type: Schema.Types.ObjectId, ref: 'Enterprise'},
    memberOf:       [{type: Schema.Types.ObjectId, ref: 'Group'}],
    friends:        [{type: Schema.Types.ObjectId, ref: 'Profiles'}],
    inbox:          [{type: Schema.Types.ObjectId, ref: 'Conversation'}],
    meta:           [{type: Schema.Types.ObjectId, ref: 'Tags'}]
},
    {autoIndex: false});

var _Profile = mongoose.model('Profiles', profileSchema);

module.exports =  {
    Profile : _Profile
};
