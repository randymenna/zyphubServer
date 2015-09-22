var async                   = require('async');
var model                   = require('../models/models');

var publisher;

var BillingMessageHandler = module.exports = function BillingMessageHandler() {

    this.msgHandleSwitch                        = {};
    this.msgHandleSwitch['NEWMESSAGE']          = this.newEvent.bind(this);

};

module.exports.publisher = publisher;

BillingMessageHandler.prototype.onMessage = function (msg, msgHandlerCallback) {
    var self = this;
    var context = JSON.parse(msg.content.toString());

    console.log('BillingMessageHandler.handleMessage() entered: message:',context);

    async.waterfall(
        [
            // get from db
            function (callback) {


                var msgHandlerFunction = context.billingEvent ? self.msgHandleSwitch[context.billingEvent.toUpperCase()] : undefined;

                if (msgHandlerFunction !== undefined) {

                    msgHandlerFunction(context, function (err, context) {

                        callback(err, context);
                    });
                }
                else {
                    callback(Error('No message handler for',context.billingEvent), null);
                }
            }
        ],

        function (err, context) {

            msgHandlerCallback(err, msg);
        }
    );
};

BillingMessageHandler.prototype.newEvent = function(context,doneCallback) {
    console.log('BillingMessageHandler.newMessage(): entered');

    var bill = new model.Billing({
        created: Date.now(),
        enterprise: context.enterprise,
        enterpriseId: context.enterpriseId,
        conversationId: context.conversationId,
        origin: context.origin,
        event: 'new message'
    });

    bill.save(function( err, billingEntry ){
        if (err){
            console.log('billingMessageHandler(): error:',err);
        }
        doneCallback(err,billingEntry);
    });
};

