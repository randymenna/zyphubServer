/**
 * Created by
 */
var NotificationMessage             = require('./notificationMessage');
var cpConstants                     = require('../constants/index');
var _                               = require('lodash');

var NotificationHelper = module.exports = function NotificationHelper() {
    this._conversationHelper = null;
};

NotificationHelper.prototype.setConversationHelper = function(conversationHelper){
    var self = this;
    self._conversationHelper = conversationHelper;
};

NotificationHelper.prototype.createNotification = function(context) {
    var self = this;
    var notification;

    switch (context.action.toUpperCase()) {
        case cpConstants.NOTIFICATION_TYPES.NEW:
            notification = self.handleNew(context);
            break;

        case cpConstants.NOTIFICATION_TYPES.READ:
            notification = self.handleRead(context);
            break;

        case cpConstants.NOTIFICATION_TYPES.REPLY:
            notification = self.handleReply(context);
            break;

        case cpConstants.NOTIFICATION_TYPES.OK:
            notification = self.handleOk(context);
            break;

        case cpConstants.NOTIFICATION_TYPES.ACCEPT:
            notification = self.handleAccept(context);
            break;

        case cpConstants.NOTIFICATION_TYPES.REJECT:
            notification = self.handleReject(context);
            break;

        case cpConstants.NOTIFICATION_TYPES.ESCALATE:
            notification = self.handleEscalate(context);
            break;

        case cpConstants.NOTIFICATION_TYPES.CLOSE:
            notification = self.handleClose(context);
            break;

        case cpConstants.NOTIFICATION_TYPES.LEAVE:
            notification = self.handleLeave(context);
            break;

        case cpConstants.NOTIFICATION_TYPES.FORWARD:
            notification = self.handleForward(context);
            break;

        case cpConstants.NOTIFICATION_TYPES.DELEGATE:
            notification = self.handleDelegate(context);
            break;
    }

    return notification;
};

NotificationHelper.prototype.buildNotification = function(context, type, build) {
    var self = this;
    var conversation = context.conversation.toObject();
    return self.buildNotificationFromObject(conversation, context.origin, context.enterpriseId, type, build, context.origin);
};

// needed to use notifications in conversationController and didnt want to change all the other code which used buildNotification
NotificationHelper.prototype.buildNotificationFromObject = function(conversation, origin, enterprise, type, build, user) {
    var self = this;

    var parts = build.split(' ');
    var notification = new NotificationMessage();

    notification.setCommonParts(self._conversationHelper, conversation, type, origin, enterprise, user);

    notification.setAllowableActions(self._conversationHelper, conversation);

    for (var i=0; i < parts.length; i++) {
        switch(parts[i]) {
            case 'content':
                notification.setContent( conversation.content );
                break;

            case 'state':
                notification.setState( conversation.state );
                break;

            case 'envelope':
                notification.setEnvelope( conversation.envelope );
                break;
        }
    }

    switch (type) {
        case cpConstants.NOTIFICATION_TYPES.NEW:
            notification.setRecipients(conversation, origin, 'members');
            break;

        case cpConstants.NOTIFICATION_TYPES.READ:
            notification.setRecipients(conversation, origin, 'owner origin');
            break;

        case cpConstants.NOTIFICATION_TYPES.REPLY:
            notification.setRecipients(conversation, origin, 'members');
            break;

        case cpConstants.NOTIFICATION_TYPES.OK:
            notification.setRecipients(conversation, origin, 'owner origin');
            notification.setTerminateConversation(conversation, origin, 'origin');
            break;

        case cpConstants.NOTIFICATION_TYPES.ACCEPT:
            notification.setRecipients(conversation, origin, 'all-members');
            notification.setTerminateConversation(conversation, origin, 'members-not-origin-owner');
            break;

        case cpConstants.NOTIFICATION_TYPES.REJECT:
            notification.setRecipients(conversation, origin, 'owner origin');
            notification.setTerminateConversation(conversation, origin, 'origin');
            break;

        case cpConstants.NOTIFICATION_TYPES.ESCALATE:
            notification.setRecipients(conversation, origin, 'members');
            notification.setTerminateConversation(conversation, origin, 'members-not-owner');
            break;

        case cpConstants.NOTIFICATION_TYPES.CLOSE:
            notification.setRecipients(conversation, origin, 'all-members');
            notification.setTerminateConversation(conversation, origin, 'all-members');
            break;

        case cpConstants.NOTIFICATION_TYPES.LEAVE:
            notification.setRecipients(conversation, origin, 'all-members');
            notification.setTerminateConversation(conversation, origin, 'origin');
            break;

        case cpConstants.NOTIFICATION_TYPES.FORWARD:
            notification.setRecipients(conversation, origin, 'members');
            break;

        case cpConstants.NOTIFICATION_TYPES.DELEGATE:
            notification.setRecipients(conversation, origin, 'all-members');
            notification.setTerminateConversation(conversation, origin, 'origin');
            break;
    }

    return notification.getNotification();
};

NotificationHelper.prototype.handleNew = function(context) {
    var self = this;
    var notification;

    // send to: conversation.origin, members
    // send envelope, state, content
    if (context.conversation) {
        notification = self.buildNotification(context, cpConstants.NOTIFICATION_TYPES.NEW, 'state content envelope');
    }

    return notification;
};

NotificationHelper.prototype.handleRead = function(context) {
    var self = this;
    var notification;

    // send to: owner
    // send: state
    if (context.conversation) {
        notification = self.buildNotification(context, cpConstants.NOTIFICATION_TYPES.READ, 'state');
    }

    return notification;
};

NotificationHelper.prototype.handleReply = function(context,doneCallback) {
    var self = this;
    var notification;

    // send to: origin, members
    // send: state, content
    if (context.conversation) {
        notification = self.buildNotification(context, cpConstants.NOTIFICATION_TYPES.REPLY, 'state content');
    }

    return notification;
};


NotificationHelper.prototype.handleOk = function(context,doneCallback) {
    var self = this;
    var notification;

    // send to: origin, conversation.origin
    // send: state
    if (context.conversation) {
        notification = self.buildNotification(context, cpConstants.NOTIFICATION_TYPES.OK, 'state envelope');
    }

    return notification;
};


NotificationHelper.prototype.handleAccept = function(context,doneCallback) {
    var self = this;
    var notification;

    // send to: conversation.origin, members
    // send: state
    if (context.conversation) {
        notification = self.buildNotification(context, cpConstants.NOTIFICATION_TYPES.ACCEPT, 'state');
    }

    return notification;
};


NotificationHelper.prototype.handleReject = function(context,doneCallback) {
    var self = this;
    var notification;

    // send to: conversation.origin, members
    // send: state
    if (context.conversation) {
        notification = self.buildNotification(context, cpConstants.NOTIFICATION_TYPES.REJECT, 'state');
    }

    return notification;
};


NotificationHelper.prototype.handleEscalate = function(context,doneCallback) {
    var self = this;
    var notification;

    // send to: origin, members
    // send: state, envelope
    if (context.conversation) {
        notification = self.buildNotification(context, cpConstants.NOTIFICATION_TYPES.ESCALATE, 'state envelope');
    }

    return notification;
};


NotificationHelper.prototype.handleClose = function(context,doneCallback) {
    var self = this;
    var notification;

    // send to: origin, members
    // send: state
    if (context.conversation) {
        notification = self.buildNotification(context, cpConstants.NOTIFICATION_TYPES.CLOSE, 'state');
    }

    return notification;
};


NotificationHelper.prototype.handleLeave = function(context,doneCallback) {
    var self = this;
    var notification;

    // send to: origin, members
    // send: state
    if (context.conversation) {
        notification = self.buildNotification(context, cpConstants.NOTIFICATION_TYPES.LEAVE, 'state');
    }

    return notification;
};


NotificationHelper.prototype.handleForward = function(context,doneCallback) {
    var self = this;
    var notification;

    // send to: origin, members
    // send: state, envelope
    if (context.conversation) {
        notification = self.buildNotification(context, cpConstants.NOTIFICATION_TYPES.FORWARD, 'state envelope');
    }

    return notification;
};


NotificationHelper.prototype.handleDelegate = function(context,doneCallback) {
    var self = this;
    var notification;

    // send to: origin, members
    // send: state envelope
    if (context.conversation) {
        notification = self.buildNotification(context, cpConstants.NOTIFICATION_TYPES.DELEGATE, 'state envelope content');
    }

    return notification;
};

NotificationHelper.prototype.convertConversationToNotification = function(conversations, user) {
    var self = this;
    var notifications;

    if (conversations instanceof Array ) {
        notifications = [];

        for (var i = 0; i < conversations.length; i++) {
            var notification = self.buildNotificationFromObject(conversations[i], conversations[i].envelope.origin, conversations[i].envelope.enterprise, 'NONE', 'state content envelope', user);
            notifications.push(notification);
        }
    } else {
        notifications = self.buildNotificationFromObject(conversations, conversations.envelope.origin, conversations.envelope.enterprise, 'NONE', 'state content envelope', user);
    }

    return notifications;
};


