/**
 * Created by Randy
 */
var mongoose                = require('mongoose');
var async                   = require('async');
var restHelper              = require('./helper/restHelper');
var model                   = require('../../models/models');

var _conversationPublisher = null;
var _schedulerPublisher = null;
var _notificationPublisher = null;
var _auditTrailPublisher = null;
var _conversationHelper = null;

exports.setConversationPublisher = function( conversationPublisher ) {
    _conversationPublisher = conversationPublisher;
}

exports.setSchedulerPublisher = function( schedulerPublisher ) {
    _schedulerPublisher = schedulerPublisher;
    if ( _conversationHelper )
        _conversationHelper.setSchedulerPublisher(schedulerPublisher);
}

exports.setNotificationPublisher = function( schedulerPublisher ) {
    _notificationPublisher = schedulerPublisher;
}

exports.setAuditTrailPublisher = function( auditTrailPublisher ) {
    _auditTrailPublisher = auditTrailPublisher;
}

exports.setConversationHelper = function( conversationHelper ) {
    _conversationHelper = conversationHelper;
    if ( _schedulerPublisher )
        _conversationHelper.setSchedulerPublisher(_schedulerPublisher);
}

exports.getConversations = function (req, res) {

    console.log("getConversations(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};
                context.origin = restHelper.extractOriginId(req);

                context.profileId = req.params.profileId;

                callback(null, context);
            },

            // get all the conversations for a user
            function(context,callback) {
                model.Profile.findOne({'_id': context.profileId}, {_id: 0, inbox: 1})
                    .exec(function (err, obj) {
                        if ( err ) {
                            callback(err, null);
                        }
                        else {
                            context.inbox = obj.inbox;
                            callback(null, context);
                        }
                    });
            },

            function(context,callback) {
                model.Conversation.find({'_id': { $in: context.inbox }})
                    .populate('envelope.origin', 'label _id')
                    .populate('envelope.members', 'label _id')
                    .populate('stats.members.member', 'label')
                    .exec(function( err, conversations){
                        if ( err ) {
                            callback(err, null);
                        }
                        else {
                            context.conversations = conversations;
                            callback(null, context);
                        }
                    });
            }
        ],

        function (err, context) {
            console.log("getConversations(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.conversations);
            } else {
                res.json(401, err.message);
            }
        }
    );
};

exports.getOneConversation = function(req, res) {

    console.log("getOneConversation(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.origin = restHelper.extractOriginId(req);
                context.conversationId = req.params.id;

                callback(null, context);
            },

            // find one conversation and fill in the name and id only of the members
            function(context,callback) {
                model.Conversation.findOne({_id: context.conversationId})
                    .populate('envelope.origin', 'label _id')
                    .populate('envelope.members', 'label _id')
                    .populate('stats.members.member', 'label')
                    .exec(function( err, conversation){
                        if ( err ) {
                            callback(err, null);
                        }
                        else {
                            context.conversation = conversation;
                            callback(null, context);
                        }
                    });
            }
        ],

        function (err, context) {
            console.log("getOneConversation(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.conversation);
            } else {
                res.json(401, err.message);
            }
        }
    );
};

// new conversation request
/*
{
    "members": [ "b462d378f20c2900001e5e33" ],
    "messageType": "STANDARD",
    "ttl" : 3600,
    "content": {
        "text":"This is a standard message"
    },
    "tags": ["3rd Floor"],
    "escalation" : { "todo - fill this in" }
}
*/


exports.newConversation = function (req, res) {

    var context = {};

    console.log("newConversation(): entered");
    async.waterfall(
        [
            // create context for new message
            function (callback) {
                var context = {};
                context.action = "new";
                context.origin = req.user.origin;

                context = _conversationHelper.decorateContext(context, req.body);

                callback(null, context);
            },

            // create & save an unrouted message
            function(context,callback) {

                var c = _conversationHelper.requestToModel( req.body, req.user );

                context.conversationId = c._id

                c.save(function( err, conversation){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        callback(null, context);
                    }
                });
            },

            // send it to the conversation router
            function (context, callback) {

                _conversationPublisher.publish('ConversationEngineQueue',context, function( error ){
                    if ( error )
                        callback(Error("Publish Failed"), null);
                    else
                        callback(null, context);
                });
            }
        ],

        function (err, context) {
            console.log("newConversation(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.conversationId);
            } else {
                res.json(400, err.message);
            }
        }
    );
};

exports.updateConversation = function (req, res) {

    console.log("updateConversation(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.origin = restHelper.extractOriginId(req);
                context.conversationId = req.params.id;
                context.action = req.params.action;
                context.profileId = context.origin;
                context.forward = req.body.forward;
                context.delegate = req.body.delegate;
                context.escalate = req.body.escalate;
                context.reply = req.body.reply;
                context.timestamp = new Date().toISOString();

                console.log(context.conversationId);

                callback(null, context);
            },

            function (context, callback) {

                _conversationPublisher.publish('ConversationEngineQueue',context, function( error ){
                    if ( error )
                        callback(Error("Publish Failed"), null);
                    else
                        callback(null, context);
                });
            }
        ],

        function (err, context) {
            console.log("updateConversation(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.conversationId);
            } else {
                res.json(400, err.message);
            }
        }
    );
};

