/**
 * Created by
 */
var NotificationMessage             = require('./notificationMessage');
var cpConstants                     = require('../constants');
var _                               = require('lodash');

var NotiificationHelper = module.exports = function NotiificationHelper() {
}

NotiificationHelper.prototype.newConversationNotification = function(context) {
    var self = this;

    var notification = {};
    notification.message = new NotificationMessage();

    notification.message.setType( cpConstants.NOTIFICATION_TYPES.NEW_CONVERSATION, context.origin );
    notification.message.setConversationId( context.conversation._id );
    notification.message.setEnvelope( context.conversation.envelope );
    notification.message.setContent( context.conversation.content );
    notification.message.setState( context.conversation.state );

    notification.recipients = _.pluck( context.conversation.envelope.members, '_id' );
    notification.recipients.push(context.conversation.envelope.origin._id);

    return notification;
}

NotiificationHelper.prototype.leaveConversationNotification = function(context) {
    var self = this;
}
