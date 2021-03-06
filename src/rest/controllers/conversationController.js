/**
 * Created by Randy
 */
var mongoose                = require('mongoose');
var async                   = require('async');
var restHelper              = require('./helper/restHelper');
var model                   = require('../../models/models');
var CONSTANTS               = require('../../constants/index');

var _conversationPublisher = null;
var _schedulerPublisher = null;
var _notificationPublisher = null;
var _auditTrailPublisher = null;
var _conversationHelper = null;
var _billingPublisher = null;
var _notificationHelper = null;

exports.setConversationPublisher = function( conversationPublisher ) {
    _conversationPublisher = conversationPublisher;
};

exports.setSchedulerPublisher = function( schedulerPublisher ) {
    _schedulerPublisher = schedulerPublisher;
    if ( _conversationHelper )
        _conversationHelper.setSchedulerPublisher(schedulerPublisher);
};

exports.setNotificationPublisher = function( schedulerPublisher ) {
    _notificationPublisher = schedulerPublisher;
};

exports.setAuditTrailPublisher = function( auditTrailPublisher ) {
    _auditTrailPublisher = auditTrailPublisher;
};

exports.setConversationHelper = function( conversationHelper ) {
    _conversationHelper = conversationHelper;
    if ( _schedulerPublisher ) {
        _conversationHelper.setSchedulerPublisher(_schedulerPublisher);
    }
    if (_notificationHelper) {
        _notificationHelper.setConversationHelper(_conversationHelper);
    }
};

exports.setBillingPublisher = function( billingPublisher ) {
    _billingPublisher = billingPublisher;
};

exports.setNotificationHelper = function( notificationHelper ) {
    _notificationHelper = notificationHelper;
    if (_conversationHelper){
        _notificationHelper.setConversationHelper(_conversationHelper);
    }
};


exports.getConversations = function (req, res) {

    console.log('getConversations(): entered');
    async.waterfall(
        [
            function (callback) {
                var context = {};
                context.origin = req.user.origin;
                console.log('getConversations(): origin ',context.origin);

                callback(null, context);
            },

            // get all the conversations for a user
            function(context,callback) {
                model.Profile.findOne({'_id': context.origin}, {_id: 0, inbox: 1})
                    .exec(function (err, profile) {
                        if ( err ) {
                            console.log('getConversations(): error ',err);
                            callback(err, null);
                        }
                        else {
                            console.log('getConversations(): inbox ',profile.toObject().inbox);
                            context.inbox = profile.toObject().inbox;
                            callback(null, context);
                        }
                    });
            },

            function(context,callback) {

                _conversationHelper.getConversationsInInbox(context, callback);
            }
        ],

        function (err, context) {
            console.log('getConversations(): exiting: err=', err);
            if (!err) {
                res.status(200).json(context.conversations);
            } else {
                res.status(401).json(err.message);
            }
        }
    );
};

exports.getOneConversation = function(req, res) {

    console.log('getOneConversation(): entered');
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
                    .populate('state.members.member', 'displayName _id')
                    .exec(function( err, conversation){
                        if ( err ) {
                            callback(err, null);
                        }
                        else {
                            conversation = conversation.toJSON();
                            conversation = _conversationHelper.allowableActions(conversation, context.origin);
                            context.conversation = _notificationHelper.convertConversationToNotification(conversation, context.origin);

                            callback(null, context);
                        }
                    });
            }
        ],

        function (err, context) {
            console.log('getOneConversation(): exiting: err=%s,result=%s', err, context);
            if (!err) {
                res.status(200).json(context.conversation);
            } else {
                res.status(401).json(err.message);
            }
        }
    );
};

exports.newConversation = function (req, res) {

    console.log('newConversation(): entered');
    async.waterfall(
        [
            // create & save an unrouted message
            function(callback) {

                // also validates the api
                _conversationHelper.requestToNewModel( req.body, req.user, function(err, context){
                    if (err) {
                        callback(Error(err), null);
                    } else {
                        context.action = 'new';
                        context.conversationId = context.conversation._id;

                        context.conversation.save(function (err, conversation) {
                            if (err) {
                                callback(err, null);
                            }
                            else {
                                context.conversation = conversation;
                                callback(null, context);
                            }
                        });
                    }
                });

            },

            // send it to the conversation router
            function (context, callback) {

                //_conversationPublisher.publish('ConversationEngineQueue',context, function( error ){
                var routingKey = parseInt(context.conversationId) % CONSTANTS.BUS.CONVERSATION_WORKERS;
                var published;
                try {
                    published = _conversationPublisher.publish(routingKey, context);
                } catch(err) {
                    console.log('_conversationPubluisher.publish():',err);
                }
                published.then(function() {
                    callback(null, context);
                }).catch(function(err){
                    callback(Error('Publish Failed: ' + err), null);
                });

            },

            // billing event
            function (context, callback) {

                //_conversationPublisher.publish('ConversationEngineQueue',context, function( error ){
                var routingKey = parseInt(context.conversationId) % CONSTANTS.BUS.BILLING_WORKERS;
                context.billingEvent = 'NewMessage';
                var published = _billingPublisher.publish(routingKey, context);
                published.then(function() {
                    callback(null, context);
                }).catch(function(err){
                    callback(Error('Publish Failed: ' + err), null);
                });
            }
        ],

        function (err, context) {
            console.log('newConversation(): exiting: err:',err);
            if (!err) {
                res.status(200).json(context.conversationId);
            } else {
                res.status(400).json(err.message);
            }
        }
    );
};

exports.updateConversation = function (req, res) {

    console.log('updateConversation(): entered');
    async.waterfall(
        [
            function (callback) {
                _conversationHelper.validateUpdateParams(req.params.action, req.body,function(err, context) {
                    if (err){
                        callback(err, null);
                    }
                    else {
                        callback(null, context);
                    }
                });
            },

            function (context, callback) {

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

                var routingKey = parseInt(context.conversationId) % CONSTANTS.BUS.CONVERSATION_WORKERS;
                var published = _conversationPublisher.publish(routingKey, context);
                published.then(function() {
                    callback(null, context);
                }).catch(function(err){
                    callback(Error('Publish Failed: ' + err), null);
                });
            }
        ],

        function (err, context) {
            console.log('updateConversation(): exiting: err=%s,result=%s', err, context);
            if (!err) {
                res.status(200).json(context.conversationId);
            } else {
                res.status(400).json(err.message);
            }
        }
    );
};

