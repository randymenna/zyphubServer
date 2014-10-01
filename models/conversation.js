/**
 * Created by randy on 9/29/14.
 */
var mongoose                = require('mongoose');
var profile                 = require('./profile');


var Schema  = mongoose.Schema;

var envelopeSchema = new Schema({
    originator:   {type: Schema.Types.ObjectId, ref: profile.Person},
    recipients:  [{type: Schema.Types.ObjectId, ref: profile.Person}],
    messageType: String,
    behaviors:   [String]
});

var timeSchema = new Schema({
    createDate: Date,
    lastModified: Date,
    ttl: Date
});

var statSchema = new Schema({
    state: [{ participant: {type: Schema.Types.ObjectId, ref: profile.Person}, state: String }],
    accepts: Number,
    rejects: Number,
    oks: Number,
    originalParticipantCount: Number,
    currentParticipantCount: Number
});

var escalationSchema = new Schema({
    currentStep: Number,
    steps: [{ recipients: [{type: Schema.Types.ObjectId, ref: profile.Person}], tte: Number, trigger: String }]
});

var contentSchema = new Schema({
    originalMessage: String,
    replies: [{ originator: {type: Schema.Types.ObjectId, ref: profile.Person}, created: Date, content: String}]
});

var conversationSchema = new Schema({
    envelope: { originator:   {type: Schema.Types.ObjectId, ref: profile.Person},
                recipients:  [{type: Schema.Types.ObjectId, ref: profile.Person}],
                messageType: String,
                behaviors:   [String]
    },
    time: { createDate: Date,
            lastModified: Date,
            ttl: Date
    },
    stats: {    state: [{ participant: {type: Schema.Types.ObjectId, ref: profile.Person}, state: String }],
                accepts: Number,
                rejects: Number,
                oks: Number,
                originalParticipantCount: Number,
                currentParticipantCount: Number
    },
    escalation: {   currentStep: Number,
                    steps: [{ recipients: [{type: Schema.Types.ObjectId, ref: profile.Person}], tte: Number, trigger: String }]
    },
    content: {  originalMessage: String,
                replies: [{ originator: {type: Schema.Types.ObjectId, ref: profile.Person}, created: Date, content: String}]
    }
});

var _Conversation = mongoose.model('Conversation', conversationSchema);

module.exports =  {
    Conversation : _Conversation
};


