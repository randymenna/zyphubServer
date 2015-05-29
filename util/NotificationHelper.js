/**
 * Created by
 */
var NotificationMessage             = require('./notificationMessage');
var cpConstants                     = require('../constants');
var _                               = require('lodash');

var NotificationHelper = module.exports = function NotificationHelper() {
};

NotificationHelper.prototype.createNotification = function(context, type, build) {
    var parts = build.split(' ');

    var notification = new NotificationMessage();

    notification.setEnterprise(context.enterprise);
    notification.setTypeAndOrigin( type, context.origin );
    notification.setConversationId( context.conversation._id );

    for (var i=0; i < parts.length; i++) {
        switch(parts[i]) {
            case 'content':
                notification.setContent( context.conversation.content );
                break;

            case 'state':
                notification.setState( context.conversation.state );
                break;

            case 'envelope':
                notification.setEnvelope( context.conversation.envelope );
                break;
        }
    }

    switch (type) {
        case cpConstants.NOTIFICATION_TYPES.NEW:
            notification.setRecipients(context, 'members');
            break;

        case cpConstants.NOTIFICATION_TYPES.READ:
            notification.setRecipients(context, 'owner');
            break;

        case cpConstants.NOTIFICATION_TYPES.REPLY:
            notification.setRecipients(context, 'members');
            break;

        case cpConstants.NOTIFICATION_TYPES.OK:
            notification.setRecipients(context, 'owner');
            notification.setTerminateConversation(context, 'origin');
            break;

        case cpConstants.NOTIFICATION_TYPES.ACCEPT:
            notification.setRecipients(context, 'owner');
            notification.setTerminateConversation(context, 'members-not-origin-owner');
            break;

        case cpConstants.NOTIFICATION_TYPES.REJECT:
            notification.setRecipients(context, 'owner');
            notification.setTerminateConversation(context, 'origin');
            break;

        case cpConstants.NOTIFICATION_TYPES.ESCALATE:
            notification.setRecipients(context, 'members');
            notification.setTerminateConversation(context, 'members-not-owner');
            break;

        case cpConstants.NOTIFICATION_TYPES.CLOSE:
            notification.setRecipients(context, 'members');
            notification.setTerminateConversation(context, 'members');
            break;

        case cpConstants.NOTIFICATION_TYPES.LEAVE:
            notification.setRecipients(context, 'members');
            notification.setTerminateConversation(context, 'origin');
            break;

        case cpConstants.NOTIFICATION_TYPES.FORWARD:
            notification.setRecipients(context, 'members');
            break;

        case cpConstants.NOTIFICATION_TYPES.DELEGATE:
            notification.setRecipients(context, 'members');
            notification.setTerminateConversation(context, 'origin');
            break;
    }

    return notification.getNotification();
};