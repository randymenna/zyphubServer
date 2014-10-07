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

                var accountId = genericMongoController.extractAccountId(req);
                context.accountId = accountId;
                context.conversationId = req.params.conversationId;

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

    var context = {};

    console.log("newConversation(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};
                
                var c = new model.Conversation({
                    envelope:req.body.envelope,
                    time:req.body.time,
                    content:req.body.content
                });

                c.state.startMemberCount = c.envelope.members.length;
                c.state.curMemberCount = c.envelope.members.length;

                for (var i=0; i< c.envelope.members.length; i++) {
                    var tmp = {
                        member : mongoose.Types.ObjectId(c.envelope.members[i]),
                        state: "UNOPENED"
                    };

                    c.state.members.push(tmp);
                }
                
                context.conversation = c;
                
                callback(null, context);
            },

            function (context, callback) {

                context.conversation.save(function( err, conversation){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        callback(null, context);
                    }
                })
            },

            // add a conversation to all the members in-boxes
            function(context,callback) {
                model.Person.update({'_id': { $in: context.conversation.envelope.members }},{$push: {inbox: context.conversation._id}}, {multi:true}, function(err, profiles){

                    context.profiles = profiles;

                    callback(err,context);
                });
            },

            // find one conversation and fill in the name and id only of the members
            function(context,callback) {
                model.Conversation.findOne({_id: context.conversation._id})
                    .populate('envelope.origin', 'label _id')
                    .populate('envelope.members', 'label _id')
                    .populate('state.members.member', 'label')
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
                context.profileId = req.body.origin;
                context.forward = req.body.forward;
                context.delegate = req.body.delegate;
                context.escalate = req.body.escalate;
                context.reply = req.body.reply;

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
                        conversationHelper.replyToConversation( context, function( err, conversation ){
                            callback(null, context);
                        });

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

            // add a conversation to all the members in-boxes
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

            // find the updated conversation and fill in the name and id only of the members
            function(context,callback) {
                model.Conversation.findOne({_id: context.conversation._id})
                    .populate('envelope.origin', 'label _id')
                    .populate('envelope.members', 'label _id')
                    .populate('state.members.member', 'label')
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

