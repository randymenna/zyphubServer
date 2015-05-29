/**
 * Created by randy on 1/27/14.
 */
var async                   = require("async");
var mongoose                = require('mongoose');
var model                   = require('../models/models');
var _                       = require('lodash');
var request                 = require('request');
var config                  = require('config');
var cpConstants             = require('../constants');

var WebHookMessageHandler = module.exports = function WebHookMessageHandler( options ) {

    this._options = options;

    this.setConversationHelper = function(conversationHelper) {
        this._conversationHelper = conversationHelper;
    };

    this.setNotificationHelper = function( notificationHelper ) {
        this._notificationHelper = notificationHelper;
    }

    this.msgHandleSwitch                = {};
    this.msgHandleSwitch['NEW']         = this.handleNew.bind(this);
    this.msgHandleSwitch['READ']         = this.handleRead.bind(this);
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


WebHookMessageHandler.prototype.handleMessagePool = function ( context, msgHandlerCallback ) {
    var self = this;

    if (context.enterprise !== self._options.enterprise){
        console.log("WebHookMessageHandler(): skipped: wrong enterprise",context);
        return;
    }
    console.log("WebHookMessageHandler(): entered: handleMessage:",context);

    var msgHandlerFunction = self.msgHandleSwitch[context.action.toUpperCase()];

    if (msgHandlerFunction !== undefined) {

        // returns participants and notification on context;
        msgHandlerFunction(context, function (err, context) {

            if ( context.notification ) {

                request.post(self._options.url, {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    json: true,
                    body: context.notification
                }, function(err, response, tokens) {
                    if(err) {
                        console.log("WebHookMessageHandler(): error: ",err, tokens);
                    } else {
                        console.log("WebHookMessageHandler(): exit: handleMessage");
                        msgHandlerCallback(null);
                    }
                });
            }
            else {
                console.log(Error("no notification created"));
            }
        });
    }
    else {
        console.log(Error("No message handler for "+context.action));
    }
};

// TODO: move all this notification creation to conversationMessageHandlder

WebHookMessageHandler.prototype.handleNew = function(context,doneCallback) {
    var self = this;

    // send to: conversation.origin, members
    // send envelope, state, content
    if (context.conversation) {
        context.notification = self._notificationHelper.createNotification(context, cpConstants.NOTIFICATION_TYPES.NEW, 'state content envelope');
    }

    doneCallback(null,context);
};

WebHookMessageHandler.prototype.handleRead = function(context,doneCallback) {
    var self = this;

    // send to: owner
    // send: state
    if (context.conversation)
        context.notification = self._notificationHelper.createNotification(context, cpConstants.NOTIFICATION_TYPES.REPLY, 'state');

    doneCallback(null,context);
};

WebHookMessageHandler.prototype.handleReply = function(context,doneCallback) {
    var self = this;

    // send to: origin, members
    // send: state, content
    if (context.conversation)
        context.notification = self._notificationHelper.createNotification(context, cpConstants.NOTIFICATION_TYPES.REPLY, 'state content');

    doneCallback(null,context);
};


WebHookMessageHandler.prototype.handleOk = function(context,doneCallback) {
    var self = this;

    // send to: origin, conversation.origin
    // send: state
    if (context.conversation)
        context.notification = self._notificationHelper.createNotification(context, cpConstants.NOTIFICATION_TYPES.OK, 'state');

    doneCallback(null,context);
};


WebHookMessageHandler.prototype.handleAccept = function(context,doneCallback) {
    var self = this;

    // send to: conversation.origin, members
    // send: state
    if (context.conversation)
        context.notification = self._notificationHelper.createNotification(context, cpConstants.NOTIFICATION_TYPES.ACCEPT, 'state');

    doneCallback(null,context);
};


WebHookMessageHandler.prototype.handleReject = function(context,doneCallback) {
    var self = this;

    // send to: conversation.origin, members
    // send: state
    if (context.conversation)
        context.notification = self._notificationHelper.createNotification(context, cpConstants.NOTIFICATION_TYPES.REJECT, 'state');

    doneCallback(null,context);
};


WebHookMessageHandler.prototype.handleEscalate = function(context,doneCallback) {
    var self = this;

    // send to: origin, members
    // send: state, envelope
    if (context.conversation)
        context.notification = self._notificationHelper.createNotification(context, cpConstants.NOTIFICATION_TYPES.ESCALATE, 'state envelope');

    doneCallback(null,context);
};


WebHookMessageHandler.prototype.handleClose = function(context,doneCallback) {
    var self = this;

    // send to: origin, members
    // send: state
    if (context.conversation)
        context.notification = self._notificationHelper.createNotification(context, cpConstants.NOTIFICATION_TYPES.CLOSE, 'state');

    doneCallback(null,context);
};


WebHookMessageHandler.prototype.handleLeave = function(context,doneCallback) {
    var self = this;

    // send to: origin, members
    // send: state
    if (context.conversation)
        context.notification = self._notificationHelper.createNotification(context, cpConstants.NOTIFICATION_TYPES.LEAVE, 'state');

    doneCallback(null,context);
};


WebHookMessageHandler.prototype.handleForward = function(context,doneCallback) {
    var self = this;

    // send to: origin, members
    // send: state, envelope
    if (context.conversation)
        context.notification = self._notificationHelper.createNotification(context, cpConstants.NOTIFICATION_TYPES.FORWARD, 'state envelope');

    doneCallback(null,context);
};


WebHookMessageHandler.prototype.handleDelegate = function(context,doneCallback) {
    var self = this;

    // send to: origin, members
    // send: state envelope
    if (context.conversation)
        context.notification = self._notificationHelper.createNotification(context, cpConstants.NOTIFICATION_TYPES.DELEGATE, 'state envelope');

    doneCallback(null,context);
};


