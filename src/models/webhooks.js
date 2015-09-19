/**
 * Created by randy on 9/29/14.
 */
var mongoose                = require('mongoose');
var conversation            = require('./conversation');

var Schema  = mongoose.Schema;

var webhookSchema = new Schema({

    enterprise: {type: String, index: {unique: true, dropDups: true}, required: true},
    url: {type: String, required: true}
});


webhookSchema.pre('save',function(next, done) {
    var self = this;

    next();
});

var _Webhooks = mongoose.model('Webhooks', webhookSchema);

module.exports =  {
    Webhook : _Webhooks
};
