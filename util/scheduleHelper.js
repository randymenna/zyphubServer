/**
 * Created by randy on 4/3/14.
 */
var cpConstants                         = require('../constants');
var async                               = require('async');
var ScheduleMessageHandler              = require('../msgHandler/SchedulerMessageHandler');
var ExchangePublisherFactory            = require('../util/bus/ExchangePublisherFactory');
var cpBus                               = require('../bus');
var ConversationHelper                  = require('../rest/controllers/helper/conversationHelper');

var conversationHelper = new ConversationHelper();

var ConversationPublisher;

cpBus.connection.on('error',function(err) {
    console.error("Conversation Controller: Unable to connect to bus: " + err);
});

cpBus.connection.on('ready',function() {

    var exchangePublisherFactory = new ExchangePublisherFactory(cpBus.connection);

    exchangePublisherFactory.createConversationExchangePublisher( function(conversationPublisher) {
        ConversationPublisher = conversationPublisher;
    });
});

var ScheduleHelper = module.exports = function ScheduleHelper () {

    this.cancelTimer = function( agenda, name, conversationId ) {

        agenda.jobs({"name": name}, function(err, jobs) {
            for(var i=0; i<jobs.length;i++) {
                if (jobs[i].attrs.data.convesationId == conversationId) {
                    jobs[i].fail("timeout canceled");
                    jobs[i].save();

                    jobs[i].remove(function(err) {
                        if(!err) console.log("Successfully removed job from collection");
                    });
                }
            }
        });
    }

};

ScheduleHelper.prototype.handleTTL = function( job, done ) {
    var self = this;

    var context = job.attrs.data.context;
    var publisher = job.attrs.data.publisher;

    context.origin = cpConstants.SYSTEM_GUID;
    context.action = 'close';
    context.conversationId = context.conversation._id;

    console.log("handleTTL() in: " + context.conversationId);

    ConversationPublisher.publish('ConversationEngineQueue',context, function( error ){
        if ( error )
            console.log("handleTTL() out: Publish Failed " + context.conversationId);
        else
            console.log("handleTTL() out" + context.conversationId);
    });

};

ScheduleHelper.prototype.handleEscalation = function( job, done ) {

    var context = {};
    context.conversationId = job.attrs.data.conversationId;
    context.escalation = [];
    context.escalation.push(job.attrs.data.escalationId);
    context
    context.origin = cpConstants.SYSTEM_GUID;

    console.log("handleEscalation() in: " + context.conversationId + ", " + context.escalationId);

    ConversationPublisher.publish('ConversationEngineQueue',context, function( error ){
        if ( error )
            console.log("handleEscalation() out: Publish Failed " + context.conversationId);
        else
            console.log("handleEscalation() out" + context.conversationId);
    });
};

ScheduleHelper.prototype.handleTagConstraint = function( job, done ) {
    var self = this;

    var ctx = job.attrs.data.context;
    var owner = ctx.tag.owner[0];
    var conversations = [ ctx.conversationId ];

    // remove owner from conversation
    conversationHelper.removeProfileFromConversations( owner, conversations, function( error, context ) {
        if ( error ) {
            console.log('handleTagConstraint(): error: %s removing profile %s from conversation %s',error,owner,context.conversationId);
        }
        console.log('handleTagConstraint(): removed %s from conversation %s',owner,ctx.conversationId);
    });
};