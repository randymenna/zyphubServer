/**
 * Created by randy on 9/29/14.
 */
var mongoose = require('mongoose');
var profile = require('./profile');


var Schema = mongoose.Schema;

var envelopeSchema = new Schema({
    originator: {type: Schema.Types.ObjectId, ref: 'Person'},
    recipients: [
        {type: Schema.Types.ObjectId, ref: 'Person'}
    ],
    messageType: String,
    behaviors: [String]
});

var timeSchema = new Schema({
    createDate: Date,
    lastModified: Date,
    ttl: Date
});

var stateSchema = new Schema({
    events: [
        { participant: {type: Schema.Types.ObjectId, ref: 'Person'}, event: String }
    ],
    accepts: Number,
    rejects: Number,
    oks: Number,
    originalParticipantCount: Number,
    currentParticipantCount: Number
});

var contentSchema = new Schema({
    originalMessage: String,
    replies: [
        { originator: {type: Schema.Types.ObjectId, ref: 'Person'}, created: Date, content: String}
    ]
});

var conversationSchema = new Schema({
    envelope: {
        origin: {type: Schema.Types.ObjectId, ref: 'Person'},
        members: [
            {type: Schema.Types.ObjectId, ref: 'Person'}
        ],
        pattern: String,
        behaviors: [String],
        meta: {
            enterprise: String
        }
    },
    time: { created: {type: Date, default: Date.now},
        modified: Date,
        toLive: {type: Number, default: -1}
    },
    state: {    members: [
                    {
                        member: {type: Schema.Types.ObjectId, ref: 'Person'},
                        lastEvent: {type: String, default: "UNREAD" }
                    }
        ],
        maxAccepts: {type: Number, default: 1},
        accepts: {type: Number, default: 0},
        rejects: {type: Number, default: 0},
        oks: {type: Number, default: 0},
        forwards: {type: Number, default: 0},
        delegates: {type: Number, default: 0},
        leaves: {type: Number, default: 0},
        startMemberCount: Number,
        curMemberCount: Number
    },
    escalation: {
        currentStep: {type: Number, default: 0},
        id: [{   type: Schema.Types.ObjectId, ref: 'Escalation'}]
    },
    content: {
        message: String,
        replies: [
            { origin: {type: Schema.Types.ObjectId, ref: 'Person'}, created: {type: Date, default: Date.now}, content: String}
        ]
    }
});

conversationSchema.pre('save', function (next) {

    this.time.lastModified = new Date();
    next();
});

var _Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = {
    Conversation: _Conversation
};


