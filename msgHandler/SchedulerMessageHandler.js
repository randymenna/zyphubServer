var async                   = require("async");
var model                   = require('../models/models');
var cpConstants             = require('../constants');

var publisher;

var SchedulerMessageHandler = module.exports = function SchedulerMessageHandler( context ) {

    this.setConversationPublisher = function( conversationPublisher ) {
        this._conversationPublisher = conversationPublisher;
        publisher = conversationPublisher;
    }

    this.setAgenda = function(agenda) {
        this.agenda = agenda;
    };

    this.msgHandleSwitch                        = {};
    this.msgHandleSwitch['SETTTL']              = this.setTTL.bind(this);
    this.msgHandleSwitch['ESCALATION']          = this.setEscalation.bind(this);
    this.msgHandleSwitch['ESCALATIONSTEP']      = this.handleEscalationStep.bind(this);

};

module.exports.publisher = publisher;

// *** Context
// context.accountId
// context.conversationId
// context.action
// context.profileId
// context.forward
// context.delegate
// context.escalate
// context.reply

SchedulerMessageHandler.prototype.handleMessagePool = function (context, msgHandlerCallback) {
    var self = this;

    console.log("SchedulerMessageHandler.handleMessage() entered: message: " + JSON.stringify(context));

    async.waterfall(
        [
            // get from db
            function (callback) {

                var msgHandlerFunction = self.msgHandleSwitch[context.action.toUpperCase()];

                if (msgHandlerFunction !== undefined) {

                    msgHandlerFunction(context, function (err, context) {

                        callback(err, context);
                    });
                }
                else {
                    callback(Error("No message handler for "+context.action), null);
                }
            }
        ],

        function (err, context) {

            msgHandlerCallback(err, context);
        }
    );
};

SchedulerMessageHandler.prototype.setTTL = function(context,doneCallback) {
    var self = this;

    var expirationTime = 'in ' + context.conversation.time.toLive + ' minutes';
    self.agenda.schedule(expirationTime,'handle ttl',{context:context});
    console.log("SchedulerMessageHandler.handleMessage() 'handle ttl' " + expirationTime);
    doneCallback(null,context);
};

SchedulerMessageHandler.prototype.setEscalation = function(context,doneCallback) {
    var escalationId = context.conversation.escalation[0];

    model.Escalation.findOne({_id: escalationId}, function (err, escalation) {
        if (err) {
            console.log("SchedulerMessageHandler.handleMessage() 'handle escalation' can't find esclation id: " + escalationId);
            doneCallback(null,context);
        }
        else {
            context.escalation = escalation;
            context.currentStep = 0;

            var time = escalation.steps[0].time;

            var expirationTime = 'in ' + context.conversation.time.toLive + ' minutes';
            self.agenda.schedule(expirationTime,'handle escalation',{context:context});

            console.log("SchedulerMessageHandler.handleMessage() 'setEscalation' " + context.conversationId);
            doneCallback(null,context);
        }
    });
};

SchedulerMessageHandler.prototype.handleEscalationStep = function(context,doneCallback) {
    var time = context.escalation.steps[context.currentStep].time;

    var expirationTime = 'in ' + time + ' minutes';
    self.agenda.schedule(expirationTime,'handle escalation',{context:context});

    console.log("SchedulerMessageHandler.handleMessage() 'handleEscalationStep' " + context.conversationId);
    doneCallback(null,context);
};