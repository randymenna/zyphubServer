var async                   = require('async');
var model                   = require('../models/models');

var publisher;

var SchedulerMessageHandler = module.exports = function SchedulerMessageHandler() {

    this.setConversationPublisher = function( conversationPublisher ) {
        this._conversationPublisher = conversationPublisher;
        publisher = conversationPublisher;
    };

    this.setAgenda = function(agenda) {
        this.agenda = agenda;
    };

    this.msgHandleSwitch                        = {};
    this.msgHandleSwitch['SETTTL']              = this.setTTL.bind(this);
    this.msgHandleSwitch['ESCALATION']          = this.setEscalation.bind(this);
    this.msgHandleSwitch['ESCALATIONSTEP']      = this.handleEscalationStep.bind(this);
    this.msgHandleSwitch['TAGCONSTRAINT']       = this.setTagConstraint.bind(this);

};

module.exports.publisher = publisher;

SchedulerMessageHandler.prototype.onMessage = function (msg, msgHandlerCallback) {
    var self = this;
    var context = JSON.parse(msg.content.toString());

    console.log('SchedulerMessageHandler.handleMessage() entered: message: ' + JSON.stringify(context));

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
                    callback(Error('No message handler for '+context.action), null);
                }
            }
        ],

        function (err, context) {

            msgHandlerCallback(err, msg);
        }
    );
};

SchedulerMessageHandler.prototype.setTTL = function(context,doneCallback) {
    var self = this;

    var expirationTime = 'in ' + context.conversation.time.toLive + ' minutes';
    self.agenda.schedule(expirationTime,'handle ttl',{context:context});
    console.log('SchedulerMessageHandler.handleMessage().setTTL()',expirationTime);
    doneCallback(null,context);
};

SchedulerMessageHandler.prototype.setEscalation = function(context,doneCallback) {
    var self = this;
    var escalationId = context.conversation.escalation[0];

    model.Escalation.findOne({_id: escalationId}, function (err, escalation) {
        if (err) {
            console.log('SchedulerMessageHandler.handleMessage().setEscalation() cannot find esclation id ', escalationId);
            doneCallback(null,context);
        }
        else {
            context.escalation = escalation;
            context.currentStep = 0;

            var escalationTime = escalation.steps[0].time;

            var escalate = 'in ' + escalationTime + ' minutes';
            self.agenda.schedule(escalate,'handle escalation',{context:context});

            console.log('SchedulerMessageHandler.handleMessage().setEscalation()',context.conversationId);
            doneCallback(null,context);
        }
    });
};

SchedulerMessageHandler.prototype.handleEscalationStep = function(context,doneCallback) {
    var self = this;
    var time = context.escalation.steps[context.currentStep].time;

    var expirationTime = 'in ' + time + ' minutes';
    self.agenda.schedule(expirationTime,'handle escalation',{context:context});

    console.log('SchedulerMessageHandler.handleMessage().handleEsacalationStep',context.conversationId);
    doneCallback(null,context);
};

SchedulerMessageHandler.prototype.setTagConstraint = function(context,doneCallback) {
    var self = this;

    var expirationTime = new Date(context.constraint);
    var job = self.agenda.schedule(expirationTime,'tag constraint',{context:context});
    console.log('SchedulerMessageHandler.handleMessage().setTagConstraint',expirationTime);
    doneCallback(null,context);
};