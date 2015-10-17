var async                   = require('async');
var mongoose                = require('mongoose');
var model                   = require('../models/models');

var ConversationMessageHandler = module.exports = function ConversationMessageHandler() {

    this.setConversationHelper = function( conversationHelper ) {
        this._conversationHelper = conversationHelper;
        if (this._schedulerPublisher) {
            this._conversationHelper.setSchedulerPublisher(this._schedulerPublisher);
        }
        if (this._notificationHelper) {
            this._notificationHelper.setConversationHelper(this._conversationHelper);
        }
    };

    this.setNotificationPublisher = function(notificationPublisher) {
        this._notificationPublisher = notificationPublisher;
    };

    this.setNotificationHelper = function( notificationHelper ) {
        this._notificationHelper = notificationHelper;
        if (this._conversationHelper){
            this._notificationHelper.setConversationHelper(this._conversationHelper);
        }
    };

    this.setAuditTrailPublisher = function(auditTrailPublisher) {
        this._auditTrailPublisher = auditTrailPublisher;
    };

    this.setSchedulerPublisher = function( schedulerPublisher ) {
        this._schedulerPublisher = schedulerPublisher;
        if ( this._conversationHelper ) {
            this._conversationHelper.setSchedulerPublisher(schedulerPublisher);
        }
    };

    this.setBillingPublisher = function(billingPublisher) {
        this._billingPublisher = billingPublisher;
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

ConversationMessageHandler.prototype.onMessage = function (msg, msgHandlerCallback) {
    var self = this;
    var context = JSON.parse(msg.content.toString());

    console.log('ConversationMessageHandler.handleMessage() entered: message: ' + context);

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
                    callback(Error('No message handler for '+context.action), null);
                }
            },

            // TODO: get rid of this

            // save to db
            function(context,callback) {
                context.conversation.save(function( err, conversation){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        callback(null, context);
                    }
                });
            },

            // send to auditor
            function(context, callback) {

                var routingKey = 0;
                var published = self._auditTrailPublisher.publish(routingKey, context);
                published.then(function() {
                    callback(null, context);
                }).catch(function(err){
                    callback(Error('Publish Failed: ' + err), null);
                });
            },

            // TODO: do the population in the individual handlers

            // get a populated model
            function(context,callback) {

                model.Conversation.findOne({_id: context.conversation._id})
                    .populate('envelope.origin', 'displayName originalId _id')
                    .populate('envelope.members', 'displayName originalId _id')
                    .populate('state.members.member', 'displayName originalId _id')
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

                var routingKey = 0;
                var published = self._notificationPublisher.publish(routingKey, notification);
                published.then(function() {
                    callback(null, context);
                }).catch(function(err){
                    callback(Error('Publish Failed: ' + err), null);
                });
            }
        ],

        function (err, context) {

            console.log('ConversationMessageHandler.handleMessage() exit: message: ' + JSON.stringify(msg.content.toString()));
            msgHandlerCallback(err, msg);
        }
    );
};

ConversationMessageHandler.prototype.handleNew = function(context,doneCallback) {
    var self = this;

    console.log('newConversation(): enter: context=%', context);

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
                                callback(Error('handleNew(): Cannot find conversation: ' + context.conversationId), null);
                            }
                        }
                    });
            },

            // route the message
            function(context,callback) {
                // adjust the context.members to expand groups and tags
                self._conversationHelper.route(context,function(err,ctx){
                    callback(err,ctx);
                });
            },

            // set message state
            function(context,callback) {

                context.conversation.envelope.members = context.members;
                context.conversation.envelope.meta.groups = context.groups;
                context.conversation.envelope.meta.tags = context.tags;

                context.conversation.state.curMemberCount = context.conversation.envelope.members.length;

                // if the message gets replayed we want to start fresh, so if it has any members in state at this point we want to get rid of them
                var len = context.conversation.state.members.length;
                for (var i=len-1; i > -1; i--){
                    context.conversation.state.members.splice(i,1);
                }

                // now populate it correctly
                for (var i=0; i< context.conversation.envelope.members.length; i++) {
                    var tmp = {
                        lastEvent: 'UNOPENED'
                    };
                    if (typeof context.conversation.envelope.members[i] === 'string' || context.conversation.envelope.members[i] instanceof String){
                        if (context.conversation.envelope.members[i] === context.origin) {
                           tmp.lastEvent = 'SENT' ;
                        }
                        tmp.member = mongoose.Types.ObjectId(context.conversation.envelope.members[i]);
                    } else {
                        if (context.conversation.envelope.members[i].toHexString() === context.origin) {
                            tmp.lastEvent = 'SENT' ;
                        }
                        tmp.member = context.conversation.envelope.members[i];
                    }

                    context.conversation.state.members.push(tmp);
                }

                if ( context.ttl ) {
                    if ( !context.conversation.envelope.time )
                        context.conversation.envelope.time = {};

                    context.conversation.envelope.time.toLive = context.ttl;
                }

                //TODO
                if ( context.escalation ) {
                    console.log('TODO: handle esclaction in NEW conversation');
                }

                context.conversation.save(function( err, conversation){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        callback(null, context);
                    }
                });
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

                    context.action = 'setTTL';

                    var routingKey = 0;
                    var published = self._schedulerPublisher.publish(routingKey, context);
                    published.then(function() {
                        callback(null, context);
                    }).catch(function(err){
                        callback(Error('Publish Failed: ' + err), null);
                    });
                }
                else {
                    callback(null, context);
                }

            },

            // schedule escalation
            function(context, callback) {

                if (context.conversation.escalation && context.conversation.escalation.id && context.conversation.escalation.id.length ) {

                    context.action = 'setEscalation';
                    var routingKey = 0;
                    var published = self._schedulerPublisher.publish(routingKey, context);
                    published.then(function() {
                        callback(null, context);
                    }).catch(function(err){
                        callback(Error('Publish Failed: ' + err), null);
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
                            ctx.action = 'tagConstraint';
                            ctx.tag = context.tags[i].toObject();
                            ctx.constraint = context.tags[i].constraint;
                            ctx.conversationId = context.conversationId;

                            var routingKey = 0;
                            var published = self._schedulerPublisher.publish(routingKey, context);
                            published.then(function() {
                                callback(null, context);
                            }).catch(function(err){
                                callback(Error('Publish Failed: ' + err), null);
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
            //console.log('newConversation(): exiting: err=%s,result=%s', err, context);

            doneCallback(err,context);
        });
};

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


