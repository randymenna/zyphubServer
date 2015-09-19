/**
 * Created by randy on 9/29/14.
 */
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var auditTrailSchema = new Schema({

    timestamp: Date,
    conversationId: {type: Schema.Types.ObjectId, ref: 'Conversation'},
    origin: {type: Schema.Types.ObjectId, ref: 'Profiles'},
    action: String,
    state: {    members: [
            {
                member: {type: Schema.Types.ObjectId, ref: 'Profiles'},
                lastEvent: {type: String },
                _id: false
            }
        ],
        maxAccepts: Number,
        accepts: Number,
        rejects: Number,
        oks: Number,
        forwards: Number,
        delegates: Number,
        leaves: Number,
        startMemberCount: Number,
        curMemberCount: Number
    },
    details: {
        type: Schema.Types.Mixed
    }
});

auditTrailSchema.pre('save', function (next) {

    this.modified = new Date();
    next();
});

var _AuditTrail = mongoose.model('AuditTrail', auditTrailSchema);

module.exports = {
    AuditTrail: _AuditTrail
};


