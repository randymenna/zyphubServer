/**
 * Created by randy on 9/29/14.
 */
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var billingSchema = new Schema({

    created: Date,
    enterprise: String,
    enterpriseId: {type: Schema.Types.ObjectId, ref: 'Enterprise'},
    conversationId: {type: Schema.Types.ObjectId, ref: 'Conversation'},
    origin: {type: Schema.Types.ObjectId, ref: 'Profiles'},
    event: String
});

billingSchema.pre('save', function (next) {

    this.modified = new Date();
    next();
});

var _Billing = mongoose.model('Billing', billingSchema);

module.exports = {
    Billing: _Billing
};


