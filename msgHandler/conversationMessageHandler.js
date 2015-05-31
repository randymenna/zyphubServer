var async                   = require("async");
var mongoose                = require('mongoose');
var model                   = require('../models/models');

var ConversationMessageHandler = module.exports = function ConversationMessageHandler( context ) {

    this.setConversationHelper = function(conversationHelper) {
        this._conversationHelper = conversationHelper;
    };

    this.setNotificationPublisher = function(notificationPublisher) {
        this._notificationPublisher = notificationPublisher;
    };

    this.setNotificationHelper = function(notificationHelper) {
        this._notificationHelper = notificationHelper;
    };

    this.setAuditTrailPublisher = function(auditTrailPublisher) {
        this._auditTrailPublisher = auditTrailPublisher;
    };

    this.setSchedulerPublisher = function(schedulerPublisher) {
        this._schedulerPublisher = schedulerPublisher;
    };

    this.msgHandleSwitch                = {};
    this.msgHandleSwitch['NEW']         = this.handleNew.bind(this);
    this.msgHandleSwitch['READ']        = this.handleRead.bind(this);
    this.msgHandleSwitch['REPLY']       = this.handleReply.bind(this);
    this.msgHandleSwitch['OK']          = this.handleOk.bind(this);
    this.msgHandleSwitch['ACCEPT']      = this.handleAccept.bind(this);
    this.msgHandleSwitch['REJECT']      = this.handleReject.bind(this);
    this.msgHandleSwitch['ESCALATE']    = this.handleEscalate.bind(this);
    this.msgHandleSwitch['CLOSE']       = this.handleClose.bind(this);
    this.msgHandleSwitch['LEAVE']       = this.handleLeave.bind(this);
    this.msgHandleSwitch['FORWARD']     = this.handleForward.bind(this);
    this.msgHandleSwitch['DELEGATE']    = this.handleDelegate.bind(this);

};

ConversationMessageHandler.prototype.handleMessagePool = function (context, msgHandlerCallback) {
    var self = this;

    console.log("ConversationMessageHandler.handleMessage() entered: message: " + JSON.stringify(context));

    async.waterfall(
        [
            // call update fn
            function (/*context,*/ callback) {

                var msgHandlerFunction = self.msgHandleSwitch[context.action.toUpperCase()];

                if (msgHandlerFunction !== undefined) {

                    msgHandlerFunction(context, function (err, context) {

                        callback(err, context);
                    });
                }
                else {
                    callback(Error("No message handler for "+context.action), null);
                }
            },

            // save to db
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

            // send to auditor
            function(context, callback) {

                self._auditTrailPublisher.publish('AuditTrailQueue',context, function( error ){
                    if ( error )
                        callback(Error("AuditQueue Publish Failed"), null);
                    else
                        callback(null, context);
                });

            },

            // get a populated model
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

                            // add populated conversation to context
                            context.conversation = conversation;

                            callback(null, context);
                        }
                    });
            },

            // broadcast change
            function(context,callback) {

                var notification = self._notificationHelper.createNotification(context);

                self._notificationPublisher.publish('CPNotificationQueue',notification, function( err ){
                    if ( err ) {
                        callback(Error("Cannot publish to NotificationQueue"), null);
                    }
                    else {
                        callback(null, context);
                    }
                })
            }
        ],

        function (err, context) {

            msgHandlerCallback(err, context);
        }
    );
};

ConversationMessageHandler.prototype.handleNew = function(context,doneCallback) {
    var self = this;

    console.log("newConversation(): enter: context=%", context);

    async.waterfall(
        [
            // fetch the message
            function (callback) {

                model.Conversation.findOne({_id: context.conversationId})
                    .exec(function( err, conversation){
                        if ( err ) {
                            callback(err, null);
                        }
                        else {
                            if ( conversation ) {
                                context.conversation = conversation;
                                callback(null, context);
                            }
                            else {
                                callback(Error("handleNew(): Cannot find conversation: " + context.conversationId), null);
                            }
                        }
                    });
            },

            // route the message
            function(context,callback) {
                self._conversationHelper.route(context,function(err,ctx){
                    callback(err,ctx);
                });
            },

            // set message state
            function(context,callback) {

                var conversation = context.conversation;

                var meta = {};
                meta.originalMembers = context.originalMembers;
                meta.groups = context.groups;
                meta.tags = context.tags;

                context.conversation.envelope.members = context.members;
                context.conversation.envelope.meta = meta;

                context.conversation.state.startMemberCount = context.conversation.envelope.members.length;
                context.conversation.state.curMemberCount = context.conversation.envelope.members.length;

                for (var i=0; i< context.conversation.envelope.members.length; i++) {
                    var tmp = {
                        member : mongoose.Types.ObjectId(context.conversation.envelope.members[i]),
                        state: "UNOPENED"
                    };

                    context.conversation.state.members.push(tmp);
                }

                if ( context.ttl ) {
                    if ( !context.conversation.envelope.time )
                        context.conversation.envelope.time = {};

                    context.conversation.envelope.time.toLive = context.ttl;
                }

                //TODO
                if ( context.escalation ) {

                }

                callback(null, context);
            },

            // save the message
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

                    callback(err,context);
                });
            },

            // schedule time based events

            // schedule ttl
            function(context, callback) {

                if ( context.ttl ) {

                    context.action = "setTTL";
                    self._schedulerPublisher.publish('SchedulerQueue', context, function (error) {
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
                    self._schedulerPublisher.publish('SchedulerQueue', context, function (error) {
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

                            self._schedulerPublisher.publish('SchedulerQueue', ctx, function (error) {
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
            }
        ],

        function (err, context) {
            console.log("newConversation(): exiting: err=%s,result=%s", err, context);

            doneCallback(err,context);
        });
}

ConversationMessageHandler.prototype.handleReply = function(context,doneCallback) {
    var self = this;
    self._conversationHelper.repyToConversation( context, function( err, ret ){

        doneCallback(err,context);
    });
};


ConversationMessageHandler.prototype.handleOk = function(context,doneCallback) {
    var self = this;
    self._conversationHelper.okConversation( context, function( err, ret ){

        doneCallback(err,context);
    });
};


ConversationMessageHandler.prototype.handleAccept = function(context,doneCallback) {
    var self = this;
    self._conversationHelper.acceptConversation( context, function( err, ret ){

        doneCallback(err,context);
    });
};


ConversationMessageHandler.prototype.handleReject = function(context,doneCallback) {
    var self = this;
    self._conversationHelper.rejectConversation( context, function( err, ret ){

        doneCallback(err,context);
    });
};


ConversationMessageHandler.prototype.handleEscalate = function(context,doneCallback) {
    var self = this;
    self._conversationHelper.escalateConversation( context, function( err, ret ){

        doneCallback(err,context);
    });
};


ConversationMessageHandler.prototype.handleClose = function(context,doneCallback) {
    var self = this;
    self._conversationHelper.closeConversation( context, function( err, ret ){

        doneCallback(err,context);
    });
};


ConversationMessageHandler.prototype.handleLeave = function(context,doneCallback) {
    var self = this;
    self._conversationHelper.leaveConversation( context, function( err, ret ){

        doneCallback(err,context);
    });
};


ConversationMessageHandler.prototype.handleForward = function(context,doneCallback) {
    var self = this;
    self._conversationHelper.forwardConversation( context, function( err, ret ){

        doneCallback(err,context);
    });
};


ConversationMessageHandler.prototype.handleDelegate = function(context,doneCallback) {
    var self = this;
    self._conversationHelper.delegateConversation( context, function( err, ret ){

        doneCallback(err,context);
    });
};

ConversationMessageHandler.prototype.handleRead = function(context,doneCallback) {
    var self = this;
    self._conversationHelper.readConversation( context, function( err, ret ){

        doneCallback(err,context);
    });
};


