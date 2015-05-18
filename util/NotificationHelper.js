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

    notification.recipients = _.pluck( context.conversation.envelope.members, '_id' );
    //notification.recipients.push(context.conversation.envelope.origin._id);

    return notification.getNotification();
};
