var async                   = require('async');
var model                   = require('../models/models');

var publisher;

var AuditMessageHandler = module.exports = function AuditMessageHandler() {

    this.msgHandleSwitch                        = {};
    this.msgHandleSwitch['LOG']                 = this.log.bind(this);

};

module.exports.publisher = publisher;

AuditMessageHandler.prototype.onMessage = function (msg, msgHandlerCallback) {
    var self = this;

    console.log('SchedulerMessageHandler.handleMessage() entered: message: ' + JSON.stringify(msg));

    if ( !context.auditAction ) {
        context.auditAction = 'log';
    }

    async.waterfall(
        [
            // get from db
            function (callback) {
                var context = JSON.parse(msg.content.toString());

                var msgHandlerFunction = self.msgHandleSwitch[context.auditAction.toUpperCase()];

                if (msgHandlerFunction !== undefined) {

                    msgHandlerFunction(context, function (err, context) {

                        callback(err, context);
                    });
                }
                else {
                    callback(Error('No message handler for '+context.auditAction), null);
                }
            }
        ],

        function (err, context) {

            msgHandlerCallback(err, msg);
        }
    );
};

AuditMessageHandler.prototype.log = function(context,doneCallback) {
    console.log('log(): entered');

    var details;

    switch( context.action.toUpperCase() ) {
        case 'FORWARD':
            details = context.forward;
            break;
        case 'DELEGATE':
            details = context.delegate;
            break;
        case 'ESCALATE':
            details = {};
            details.escalate = context.escalation.targets;
            details.trigger = context.escalation.trigger;
            break;
        case 'REPLY':
            details = context.reply;
            break;
        case 'NEW':
            details = context.conversation.content.message;
            break;
    }

    // *** Context
    // context.accountId
    // context.conversationId
    // context.action
    // context.profileId
    // context.forward
    // context.delegate
    // context.escalate
    // context.reply

    var a = new model.AuditTrail({
        timestamp: context.timestamp,
        conversationId: context.conversationId,
        action: context.action,
        origin: context.origin,
        state: context.conversation.state,
        details: details
    });

    a.markModified('details');
    a.save(function( err, auditEntry ){
        if (err){
            console.log('auditMessageHandler(): error:',err);
        }
        doneCallback(err,auditEntry);
    });
};

