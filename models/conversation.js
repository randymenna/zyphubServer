/**
 * Created by randy on 9/29/14.
 */
var mongoose                = require('mongoose');
var profile                 = require('./profile');


var Schema  = mongoose.Schema;

var envelopeSchema = new Schema({
    originator:   {type: Schema.Types.ObjectId, ref: 'Person'},
    recipients:  [{type: Schema.Types.ObjectId, ref: 'Person'}],
    messageType: String,
    behaviors:   [String]
});

var timeSchema = new Schema({
    createDate: Date,
    lastModified: Date,
    ttl: Date
});

var stateSchema = new Schema({
    events: [{ participant: {type: Schema.Types.ObjectId, ref: 'Person'}, event: String }],
    accepts: Number,
    rejects: Number,
    oks: Number,
    originalParticipantCount: Number,
    currentParticipantCount: Number
});

var escalationSchema = new Schema({
    currentStep: Number,
    steps: [{ recipients: [{type: Schema.Types.ObjectId, ref:'Person'}], tte: Number, trigger: String }]
});

var contentSchema = new Schema({
    originalMessage: String,
    replies: [{ originator: {type: Schema.Types.ObjectId, ref: 'Person'}, created: Date, content: String}]
});

var escalationSchema = new Schema({
    name:           String,
    description:    String,
    public:         Boolean,
    enterprise:     {type: String, default: "ConversePoint"},
    currentStep:    {type: Number, default: 0},
    steps:          [{
        time:       {type: Number, default: 300},
        targets:    [{type: Schema.Types.ObjectId, ref: 'Person'}],
        trigger:    {type: String, default: "NO_READS"}
    }],
    owner:          [{type: Schema.Types.ObjectId, ref: 'Person'}]
});

var conversationSchema = new Schema({
    envelope: { origin:     {type: Schema.Types.ObjectId, ref: 'Person'},
        members:    [{type: Schema.Types.ObjectId, ref: 'Person'}],
        pattern:    String,
        behaviors:  [String],
        meta: {
            enterprise: String
        }
    },
    time: { created:     {type: Date, default: Date.now},
            modified:     Date,
            toLive:       {type: Number, default: -1}
    },
    state: {    members: [{
        member: {type: Schema.Types.ObjectId, ref: 'Person'},
        lastEvent: String
    }],
        maxAccepts: {type: Number, default: 1},
        accepts:    {type: Number, default: 0},
        rejects:    {type: Number, default: 0},
        oks:        {type: Number, default: 0},
        forwards:   {type: Number, default: 0},
        delegates:  {type: Number, default: 0},
        leaves:     {type: Number, default: 0},
        startMemberCount:   Number,
        curMemberCount:     Number
    },
    escalation: [{type: Schema.Types.ObjectId, ref: 'Escalation'}],
    content: {  message:    String,
                replies:    [{ originator: {type: Schema.Types.ObjectId, ref: 'Person'}, created: Date, content: String}]
    }
});

conversationSchema.pre('save', function(next) {

    this.time.lastModified =  new Date();
    next();
});

var _Conversation = mongoose.model('Conversation', conversationSchema);

module.exports =  {
    Conversation : _Conversation
};


