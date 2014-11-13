var async                   = require("async");
var mongoose                = require('mongoose');
var model                   = require('../models/models');

var ConversationMessageHandler = module.exports = function ConversationMessageHandler( context ) {

    this.setConversationHelper = function(conversationHelper) {
        this._conversationHelper = conversationHelper;
    };

    this.setSocketIOPublisher = function(socketIOPublisher) {
        this._socketIOPublisher = socketIOPublisher;
    };

    this.setAuditTrailPublisher = function(auditTrailPublisher) {
        this._auditTrailPublisher = auditTrailPublisher;
    };
    this.msgHandleSwitch                = {};
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

// *** Context
// context.accountId
// context.conversationId
// context.action
// context.profileId
// context.forward
// context.delegate
// context.escalate
// context.reply

ConversationMessageHandler.prototype.handleMessagePool = function (context, msgHandlerCallback) {
    var self = this;

    console.log("ConversationMessageHandler.handleMessage() entered: message: " + JSON.stringify(context));

    async.waterfall(
        [
            // get from db
            function (callback) {

                model.Conversation.findOne({_id: context.conversationId}, function (err, conversation) {
                    if (err) {
                        callback(err, null);
                    }
                    else {
                        context.conversation = conversation;
                        callback(null, context);
                    }
                });
            },

            // call update fn
            function (context, callback) {

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
                self._socketIOPublisher.publish('SocketIOExchange',context, function( err ){
                    if ( err ) {
                        callback(Error("Cannot publish to SocketIO"), null);
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

ConversationMessageHandler.prototype.handleReply = function(context,doneCallback) {
    var self = this;
    this._conversationHelper.repyToConversation( context, function( err, ret ){

        doneCallback(null,context);
    });
};


ConversationMessageHandler.prototype.handleOk = function(context,doneCallback) {
    var self = this;
    this._conversationHelper.okConversation( context, function( err, ret ){

        doneCallback(null,context);
    });
};


ConversationMessageHandler.prototype.handleAccept = function(context,doneCallback) {
    var self = this;
    this._conversationHelper.acceptConversation( context, function( err, ret ){

        doneCallback(null,context);
    });
};


ConversationMessageHandler.prototype.handleReject = function(context,doneCallback) {
    var self = this;
    this._conversationHelper.rejectConversation( context, function( err, ret ){

        doneCallback(null,context);
    });
};


ConversationMessageHandler.prototype.handleEscalate = function(context,doneCallback) {
    var self = this;
    this._conversationHelper.escalateConversation( context, function( err, ret ){

        doneCallback(null,context);
    });
};


ConversationMessageHandler.prototype.handleClose = function(context,doneCallback) {
    var self = this;
    this._conversationHelper.closeConversation( context, function( err, ret ){

        doneCallback(null,context);
    });
};


ConversationMessageHandler.prototype.handleLeave = function(context,doneCallback) {
    var self = this;
    this._conversationHelper.leaveConversation( context, function( err, ret ){

        doneCallback(null,context);
    });
};


ConversationMessageHandler.prototype.handleForward = function(context,doneCallback) {
    var self = this;
    this._conversationHelper.forwardConversation( context, function( err, ret ){

        doneCallback(null,context);
    });
};


ConversationMessageHandler.prototype.handleDelegate = function(context,doneCallback) {
    var self = this;
    this._conversationHelper.delegateConversation( context, function( err, ret ){

        doneCallback(null,context);
    });
};


