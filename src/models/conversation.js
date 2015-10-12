/**
 * Created by randy on 9/29/14.
 */
var mongoose = require('mongoose');


var Schema = mongoose.Schema;

var conversationSchema = new Schema({
    envelope: {
        origin: {type: Schema.Types.ObjectId, ref: 'Profiles'},
        enterprise: {type: Schema.Types.ObjectId, ref: 'Enterprises'},
        members: [
            {type: Schema.Types.ObjectId, ref: 'Profiles'}
        ],
        latestMember: {type: Schema.Types.ObjectId, ref: 'Profiles'},
        context: [String],
        pattern: String,
        priority: {type: Number, default: 1},
        meta: {
            enterprise: {type: String, default: 'ConversePoint'},
            originalMembers: [ {type: Schema.Types.ObjectId} ],
            groups: [ {type: Schema.Types.ObjectId, ref: 'Group'} ],
            tags: [ {type: Schema.Types.ObjectId, ref: 'Tag'} ]
        }
    },
    time: {
        created: {type: Date, default: Date.now},
        modified: Date,
        toLive: {type: Number, default: -1}
    },
    state: {
        members: [{
            member: {type: Schema.Types.ObjectId, ref: 'Profiles'},
            lastEvent: {type: String, default: 'UNREAD' },
            _id: false
        }],
        maxAccepts: {type: Number, default: 1},
        accepts: {type: Number, default: 0},
        rejects: {type: Number, default: 0},
        oks: {type: Number, default: 0},
        forwards: {type: Number, default: 0},
        delegates: {type: Number, default: 0},
        leaves: {type: Number, default: 0},
        startMemberCount: Number,
        curMemberCount: Number,
        open: {type: Boolean, default: true}
    },
    escalation: {
        currentStep: {type: Number, default: 0},
        id: [{   type: Schema.Types.ObjectId, ref: 'Escalation'}]
    },
    content: {
        message: String,
        replies: [
            { origin: {type: Schema.Types.ObjectId, ref: 'Profiles'}, created: {type: Date, default: Date.now}, content: String}
        ]
    },
    allowableActions: [String]
});

conversationSchema.pre('save', function (next) {

    this.time.modified = new Date();
    next();
});

conversationSchema.set('toJSON',{
    transform: function(doc, ret, options){

        delete ret.__v;
        delete ret.envelope.meta;
        if (!ret.escalation || (ret.escalation.id && !ret.escalation.id.length)) {
            delete ret.escalation;
        }
        if ( !ret.envelope.tags || !ret.envelope.tags.length ) {
            delete ret.envelope.tags;
        }

        return ret;
    }
});

var _Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = {
    Conversation: _Conversation
};


