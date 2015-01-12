/**
 * Created by Randy
 */
var mongoose                = require('mongoose');
var async                   = require('async');
var restHelper              = require('./helper/restHelper');
var model                   = require('../../models/models');

var _conversationPublisher = null;
var _schedulerPublisher = null;
var _socketIOPublisher = null;
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

exports.setSocketIOPublisher = function( schedulerPublisher ) {
    _socketIOPublisher = schedulerPublisher;
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

exports.newConversation = function (req, res) {

    var context = {};

    console.log("newConversation(): entered");
    async.waterfall(
        [
            // members gets populated with the profiles from groups and/or contexts
            function (callback) {
                var context = {};
                context.action = "new";
                context.timestamp = new Date().toISOString();
                context.origin = req.user.origin;

                context.body = req.body;

                _conversationHelper.route(context,function(err,ctx){
                    callback(err,ctx);
                });
            },

            function(context,callback) {

                var c = new model.Conversation({
                    envelope:req.body.envelope,
                    time:req.body.time,
                    content:req.body.content
                });

                var meta = {};
                meta.originalMembers = context.originalMembers;
                meta.groups = context.groups;

                c.envelope.members = context.members;
                c.envelope.meta = meta;

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
                context.conversationId = c._id
                
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
                model.Profile.update({'_id': { $in: context.conversation.envelope.members }},{$push: {inbox: context.conversation._id}}, {multi:true}, function(err, profiles){

                    context.profiles = profiles;

                    callback(err,context);
                });
            },

            // schedule time based events

            // schedule ttl
            function(context, callback) {

                if (context.conversation.time && context.conversation.time.toLive ) {

                    context.action = "setTTL";
                    _schedulerPublisher.publish('SchedulerQueue', context, function (error) {
                        if (error)
                            callback(Error("Scheduler Publish Failed: setTTL"), null);
                        else
                            callback(null, context);
                    });
                }
                else {
                    callback(null, context);
                }

            },

            // schedule escalation
            function(context, callback) {

                if (context.conversation.escalation && context.conversation.escalation.id && context.conversation.escalation.id.length ) {

                    context.action = "setEscalation";
                    _schedulerPublisher.publish('SchedulerQueue', context, function (error) {
                        if (error)
                            callback(Error("Scheduler Publish Failed: setEscalation"), null);
                        else
                            callback(null, context);
                    });
                }
                else {
                    callback(null, context);
                }

            },

            // schedule tag constraints
            function(context, callback) {

                if ( context.tags ) {

                    for(var i=0; i<context.tags.length; i++) {
                        if ( context.tags[i].constraint ) {
                            var ctx = {};
                            ctx.action = "tagConstraint";
                            ctx.tag = context.tags[i].toObject();
                            ctx.constraint = context.tags[i].constraint;
                            ctx.conversationId = context.conversationId;

                            _schedulerPublisher.publish('SchedulerQueue', ctx, function (error) {
                                if (error)
                                    console.log("Scheduler Publish Failed: tagConstraint");
                            });
                        }
                        callback(null, context);
                    }

                }
                else {
                    callback(null, context);
                }

            },

            // socket io notifier
            function(context, callback) {

                context.action = "new";

                _socketIOPublisher.publish('SocketIOQueue',context, function( error ){
                    if ( error )
                        callback(Error("SocketIO Publish Failed"), null);
                    else
                        callback(null, context);
                });

            },

            // audit trail
            function(context, callback) {

                _auditTrailPublisher.publish('AuditTrailQueue',context, function( error ){
                    if ( error )
                        callback(Error("AuditQueue Publish Failed"), null);
                    else
                        callback(null, context);
                });

            },

            // return a populated conversation
            function(context,callback) {
                model.Conversation.findOne({_id: context.conversation._id})
                    .populate('envelope.origin', 'displayName id')
                    .populate('envelope.members', 'displayName id')
                    .populate('state.members.member', 'displayName')
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
            },

            /*
            // send to auditor
            function(context, callback) {

                _auditTrailPublisher.publish('AuditTrailQueue',context, function( error ){
                    if ( error )
                        callback(Error("AuditQueue Publish Failed"), null);
                    else
                        callback(null, context);
                });

            }
            */
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

