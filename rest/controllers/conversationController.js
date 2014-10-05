/**
 * Created by al on 9/4/14.
 */
var mongoose                = require('mongoose');
var async                   = require('async');
var genericMongoController  = require('./genericMongoController')
var model                   = require('../../models/models');
var ConversationHelper      = require('../../util/ConversationHelper');

var conversationHelper = new ConversationHelper();

exports.getConversations = function (req, res) {

    console.log("getConversations(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};
                var accountId = genericMongoController.extractAccountId(req);

                context.accountId = accountId;
                context.profileId = req.params.profileId;

                callback(null, context);
            },

            // get all the conversations for a user
            function(context,callback) {
                model.Person.findOne({'_id': context.profileId}, {_id: 0, inbox: 1})
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
                    .populate('envelope.originator', 'label _id')
                    .populate('envelope.recipients', 'label _id')
                    .populate('stats.view.participant', 'label')
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

                var accountId = genericMongoController.extractAccountId(req);
                context.accountId = accountId;
                context.conversationId = req.params.conversationId;

                callback(null, context);
            },

            // find one conversation and fill in the name and id only of the participants
            function(context,callback) {
                model.Conversation.findOne({_id: context.conversationId})
                    .populate('envelope.originator', 'label _id')
                    .populate('envelope.recipients', 'label _id')
                    .populate('stats.view.participant', 'label')
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
            console.log("getOneConversation(): exiting: err=%s,result=%s", err.message, context);
            if (!err) {
                res.json(200, context.conversation);
            } else {
                res.json(401, err.message);
            }
        }
    );
};

exports.newConversation = function (req, res) {

    console.log("newConversation(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};
                var accountId = genericMongoController.extractAccountId(req);
                context.accountId = accountId;

                callback(null, context);
            },

            function (context, callback) {
                var c = new model.Conversation({
                                            envelope:req.body.envelope,
                                            time:req.body.time,
                                            content:req.body.content
                                            });

                c.stats.originalParticipantCount = c.envelope.recipients.length;
                c.stats.currentParticipantCount = c.envelope.recipients.length;

                for (var i=0; i< c.envelope.recipients.length; i++) {
                    var tmp = {
                            participant : mongoose.Types.ObjectId(c.envelope.recipients[i]),
                            state: "UNOPENED"
                    };

                    c.stats.view.push(tmp);
                }

                context.conversation = c;

                context.conversation.save(function( err, conversation){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        callback(null, context);
                    }
                })
            },

            // add a conversation to all the recipients in-boxes
            function(context,callback) {
                model.Person.update({'_id': { $in: context.conversation.envelope.recipients }},{$push: {inbox: context.conversation._id}}, {multi:true}, function(err, profiles){

                    context.profiles = profiles;

                    callback(err,context);
                });
            },

            // find one conversation and fill in the name and id only of the participants
            function(context,callback) {
                model.Conversation.findOne({_id: context.conversation._id})
                    .populate('envelope.originator', 'label _id')
                    .populate('envelope.recipients', 'label _id')
                    .populate('stats.view.participant', 'label')
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
            console.log("newConversation(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.conversation);
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
                var accountId = genericMongoController.extractAccountId(req);

                context.accountId = accountId;
                context.conversationId = req.params.id;
                context.action = req.params.action;
                context.profileId = req.body.originator;
                context.forward = req.body.forward;
                context.delegate = req.body.delegate;
                context.escalate = req.body.escalate;

                console.log(context.conversationId);

                callback(null, context);
            },

            function (context, callback) {

                model.Conversation.findOne({_id: context.conversationId})
                    .exec(function( err, conversation){
                        if ( err ) {
                            callback(err, null);
                        }
                        else {
                            context.conversation = conversation;
                            callback(null, context);
                        }
                    });
            },

            function (context, callback) {

                switch( context.action ) {

                    case "reply":
                        context.conversation.content.replies.push( data );
                        break;

                    case "leave":
                        conversationHelper.leaveConversation( context, function( err, conversation ){
                            callback(null, context);
                        });
                        break;

                    case "reject":
                        conversationHelper.rejectConversation( context, function( err, conversation ){
                            callback(null, context);
                        });
                        break;

                    case "ok":
                        conversationHelper.okConversation( context, function( err, conversation ){
                            callback(null, context);
                        });
                        break;

                    case "accept":
                        conversationHelper.acceptConversation( context, function( err, conversation ){
                            callback(null, context);
                        });
                        break;

                    case "close":
                        conversationHelper.closeConversation( context, function( err, conversation ){
                            callback(null, context);
                        });
                        break;

                    case "forward":
                        conversationHelper.forwardConversation( context, function( err, conversation ){
                            callback(null, context);
                        });
                        break;

                    case "delegate":
                        conversationHelper.delegateConversation( context, function( err, conversation ){
                            callback(null, context);
                        });
                        break;

                    case "escalate":
                        conversationHelper.escalateConversation( context, function( err, conversation ){
                            callback(null, context);
                        });
                        break;
                }
            },

            // add a conversation to all the recipients in-boxes
            function(context,callback) {
                context.conversation.save(function( err, conversation){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        callback(null, context);
                    }
                })
            },

            // find the updated conversation and fill in the name and id only of the participants
            function(context,callback) {
                model.Conversation.findOne({_id: context.conversation._id})
                    .populate('envelope.originator', 'label _id')
                    .populate('envelope.recipients', 'label _id')
                    .populate('stats.view.participant', 'label')
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
            console.log("updateConversation(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.conversation);
            } else {
                res.json(400, err.message);
            }
        }
    );
};

