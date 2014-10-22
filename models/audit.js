/**
 * Created by randy on 9/29/14.
 */
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var auditSchema = new Schema({
    conversationId: {type: Schema.Types.ObjectId, ref: 'Conversation'},
    origin: String,
    action: String,
    created: {type: Date, default: Date.now},
    details: {
        delegate: {type: Schema.Types.ObjectId, ref: 'Person'},
        forward: [{type: Schema.Types.ObjectId, ref: 'Person'}],
        escalate: [{type: Schema.Types.ObjectId, ref: 'Person'}],
        trigger: String,
        reply: String
    }
});

escalationSchema.pre('save', function (next) {

    this.created = new Date();
    next();
});

var _Audit = mongoose.model('Audit', auditSchema);

module.exports = {
    Audit: _Audit
};


