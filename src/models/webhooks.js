/**
 * Created by randy on 9/29/14.
 */
var mongoose                = require('mongoose');

var Schema  = mongoose.Schema;

var webhookSchema = new Schema({

    enterprise: {type: String, index: {unique: true, dropDups: true}, required: true},
    url: {type: String, required: true}
});

var _Webhooks = mongoose.model('Webhooks', webhookSchema);

module.exports =  {
    Webhook : _Webhooks
};
