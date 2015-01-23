/**
 * Created by randy on 1/27/14.
 */
var async                   = require("async");
var mongoose                = require('mongoose');
var model                   = require('../models/models');
var clientMap               = require('../util/clientMap');
var _                       = require('lodash');

var NotificationMessageHandler = module.exports = function NotificationMessageHandler( context ) {

    this.setConversationHelper = function(conversationHelper) {
        this._conversationHelper = conversationHelper;
    };

    this.setNotificationHelper = function( notificationHelper ) {
        this._notificationHelper = notificationHelper;
    }

    this.msgHandleSwitch                = {};
    this.msgHandleSwitch['NEW']         = this.handleNew.bind(this);
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


NotificationMessageHandler.prototype.handleMessagePool = function ( context, msgHandlerCallback ) {
    var self = this;

    console.log("NotificationMessageHandler(): entered: handleMessage:" + context);

    async.waterfall(
        [
            // get a list of participants to notify
            function (callback) {

                var msgHandlerFunction = self.msgHandleSwitch[context.action.toUpperCase()];

                if (msgHandlerFunction !== undefined) {

                    // returns participants and notification on context;
                    msgHandlerFunction(context, function (err, context) {

                        context.notification.recipientSocketIds = clientMap.getSocketList(context.notification.recipients);

                        callback(err, context);
                    });
                }
                else {
                    callback(Error("No message handler for "+context.action), null);
                }
            },

            // send the notification
            function(context, callback) {

                if (context.notification.recipientSocketIds.length) {
                    for (var i=0; i < context.notification.recipientSocketIds.length; i++) {
                        var socket = context.notification.recipientSocketIds[i];

                        if (socket != null) {
                            socket.send(context.notification.message.getMessage());
                            console.log("NotificationMessageHandler(): sent to topic: " + context.notification.topic);
                        }
                    }
                    callback(null,context);
                } else {
                    console.log("NotificationMessageHandler(): no clients found: ");
                    callback(null,context);
                }

            }
        ],

        function (err, context) {

            msgHandlerCallback(null);
            console.log("NotificationMessageHandler(): exit: handleMessage");
        }
    );
};


NotificationMessageHandler.prototype.handleNew = function(context,doneCallback) {
    var self = this;

    // send to: conversation.origin, members
    // send envelope, state, content
    context.notification = self._notificationHelper.newConversationNotification(context);

    doneCallback(null,context);
}

NotificationMessageHandler.prototype.handleReply = function(context,doneCallback) {
    var self = this;

    // send to: origin, members
    // send: state, content

    doneCallback(err,context);
};


NotificationMessageHandler.prototype.handleOk = function(context,doneCallback) {
    var self = this;

    // send to: origin, conversation.origin
    // send: state

    doneCallback(err,context);
};


NotificationMessageHandler.prototype.handleAccept = function(context,doneCallback) {
    var self = this;

    // send to: conversation.origin, members
    // send: state

    doneCallback(err,context);
};


NotificationMessageHandler.prototype.handleReject = function(context,doneCallback) {
    var self = this;

    // send to: conversation.origin, members
    // send: state

    doneCallback(err,context);
};


NotificationMessageHandler.prototype.handleEscalate = function(context,doneCallback) {
    var self = this;

    // send to: origin, members
    // send: state

    doneCallback(err,context);
};


NotificationMessageHandler.prototype.handleClose = function(context,doneCallback) {
    var self = this;

    // send to: origin, members
    // send: state

    doneCallback(err,context);
};


NotificationMessageHandler.prototype.handleLeave = function(context,doneCallback) {
    var self = this;

    // send to: origin, members
    // send: state

    doneCallback(err,context);
};


NotificationMessageHandler.prototype.handleForward = function(context,doneCallback) {
    var self = this;

    // send to: origin, members
    // send: state

    doneCallback(err,context);
};


NotificationMessageHandler.prototype.handleDelegate = function(context,doneCallback) {
    var self = this;

    // send to: origin, members
    // send: state

    doneCallback(err,context);
};


