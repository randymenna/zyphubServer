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
                context.origin = req.user.origin;

                context.profileId = req.params.profileId;

                callback(null, context);
            },

            // get all the conversations for a user
            function(context,callback) {
                model.Profile.findOne({'_id': context.origin}, {_id: 0, inbox: 1})
                    .exec(function (err, profile) {
                        if ( err ) {
                            callback(err, null);
                        }
                        else {
                            context.inbox = profile.toObject().inbox;
                            callback(null, context);
                        }
                    });
            },

            function(context,callback) {

                _conversationHelper.getConversationsInInbox(context, callback);
            }
        ],

        //TODO: express deprecated res.json(status, obj): Use res.status(status).json(obj) instead at rest/controllers/conversationController.js

        function (err, context) {
            console.log("getConversations(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                //res.json(200, context.conversations);
                res.status(200).json(context.conversations);
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

                context.origin = req.user.origin;
                context.conversationId = req.params.id;

                callback(null, context);
            },

            // find one conversation and fill in the name and id only of the members
            function(context,callback) {
                model.Conversation.findOne({_id: context.conversationId})
                    .populate('envelope.origin', 'displayName _id')
                    .populate('envelope.members', 'displayName _id')
                    .populate('stats.members.member', 'displayName _id')
                    .exec(function( err, conversation){
                        if ( err ) {
                            callback(err, null);
                        }
                        else {
                            context.conversation = _conversationHelper.sanitize(conversation, context.origin);
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
                context.enterprise = req.user.enterprise;

                context = _conversationHelper.decorateContext(context, req.body);

                callback(null, context);
            },

            // create & save an unrouted message
            function(context,callback) {

                var c = _conversationHelper.requestToModel( context );

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

                model.Conversation.findOne({'_id': req.params.id})
                    .exec(function( err, conversation ){
                        if ( err ) {
                            callback(err, null);
                        }
                        else {
                            if ( conversation ) {

                                if (conversation.state.open) {
                                    callback(null, context);
                                }
                                else {
                                    callback({message: 'conversation closed'}, null);
                                }
                            }
                            else {
                                callback({message: 'conversation not found'}, null);
                            }
                        }
                    });
            },

            function (context, callback) {

                context.origin = req.user.origin;
                context.enterprise = req.user.enterprise;

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

