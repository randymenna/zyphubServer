/**
 * Created by randy on 1/22/15.
 */
var _                       = require('lodash');
var cpConstants             = require('../constants/index');

var NotificationMessage = module.exports = function NotificationMessage() {
    this._notification = {};
};

NotificationMessage.prototype.setEnterprise = function( enterprise ) {
    this._notification.enterprise = enterprise;
};

NotificationMessage.prototype.setConversationId = function( id ) {
    this._notification.conversation = id;
};

NotificationMessage.prototype.setTypeAndOrigin = function( type, origin ) {
    this._notification.type = type;
    this._notification.origin = origin;
};

NotificationMessage.prototype.setEnvelope = function( envelope ) {
    this._notification.envelope = {};
    this._notification.envelope.origin = envelope.origin._id.toString();
    if (envelope.members) {
        this._notification.envelope.members = envelope.members.slice(0);

        for (var i=0; i < this._notification.envelope.members.length; i++ ){
            this._notification.envelope.members[i] = this._notification.envelope.members[i]._id.toString();
        }
    }
    this._notification.envelope.messageType = envelope.pattern;
    this._notification.envelope.priority = envelope.priority;
    if (this._notification.envelope.tags) {
        this._notification.envelope.tags = envelope.tags.slice(0);
    }
};

NotificationMessage.prototype.setContent = function( content ) {
    this._notification.content = {};
    this._notification.content.message = content.message;
    this._notification.content.replies = content.replies.slice(0);
};

NotificationMessage.prototype.setState = function( state ) {
    this._notification.state = {};
    this._notification.state.currentMemberCount     = state.curMemberCount;
    this._notification.state.startMemberCount       = state.startMemberCount;
    this._notification.state.open                   = state.open;
    this._notification.state.leaves                 = state.leaves;
    this._notification.state.delegates              = state.delegates;
    this._notification.state.forwards               = state.forwards;
    this._notification.state.oks                    = state.oks;
    this._notification.state.rejects                = state.rejects;
    this._notification.state.accepts                = state.accepts;
    this._notification.state.maxAccepts             = state.maxAccepts;
    if (state.members.length) {
        this._notification.state.members = state.members.slice(0);

        for(var i=0; i < this._notification.state.members.length; i++){
            if (this._notification.state.members[i].member) {
                this._notification.state.members[i].member = this._notification.state.members[i].member._id.toString();
            }
        }
    }
};

NotificationMessage.prototype.setRecipients = function( context, build ) {
    this._notification.recipients = [];

    var parts = build.split(' ');

    for (var i=0; i < parts.length; i++) {
        switch(parts[i]) {
            case 'owner':
                this._notification.recipients.push(context.conversation.envelope.origin._id.toString());
                break;

            case 'origin':
                this._notification.recipients.push(context.origin);
                break;

            case 'members':
                this._notification.recipients = this._notification.recipients.concat(_.pluck( context.conversation.envelope.members, '_id' ));
                for (var i=0; i < this._notification.recipients.length; i++){
                    this._notification.recipients[i] = this._notification.recipients[i].toString();
                }
                break;

            case 'original-members':
                for (var i=0; i< context.conversation.envelope.meta.originalMembers.length; i++){
                    this._notification.recipients.push(context.conversation.envelope.meta.originalMembers[i].toString());
                }
                this._notification.recipients.push(context.conversation.envelope.origin._id.toString());
                break;
        }
    }

};

NotificationMessage.prototype.setTerminateConversation = function( context, build ) {
    this._notification.terminateConversation = [];

    var parts = build.split(' ');

    for (var i=0; i < parts.length; i++) {
        switch(parts[i]) {
            case 'owner':
                this._notification.terminateConversation.push(context.conversation.envelope.origin._id.toString());
                break;

            case 'origin':
                this._notification.terminateConversation.push(context.origin);
                break;

            case 'members':
                this._notification.terminateConversation = this._notification.terminateConversation.concat(_.pluck( context.conversation.envelope.members, '_id' ));
                for (var i=0; i < this._notification.terminateConversation.length; i++){
                    this._notification.terminateConversation[i] = this._notification.terminateConversation[i].toString();
                }
                break;

            case 'original-members':
                for (var i=0; i< context.conversation.envelope.meta.originalMembers.length; i++){
                    this._notification.terminateConversation.push(context.conversation.envelope.meta.originalMembers[i].toString());
                }
                this._notification.terminateConversation.push(context.conversation.envelope.origin._id.toString());
                break;

            case 'members-not-origin-owner':
                var tmp = this._notification.terminateConversation.concat(_.pluck( context.conversation.envelope.members, '_id' ));

                for (var i=0; i < this._notification.terminateConversation.length; i++){
                    this._notification.terminateConversation[i] = this._notification.terminateConversation[i].toString();
                }

                var i = tmp.indexOf(context.conversation.envelope.origin._id.toString());
                if (i !== -1) {
                    tmp.splice(i,1);
                }
                i = tmp.indexOf(context.origin);
                if (i !== -1) {
                    tmp.splice(i,1);
                }
                this._notification.terminateConversation = this._notification.terminateConversation.concat(tmp);

            case 'members-not-owner':
                var tmp = this._notification.terminateConversation.concat(_.pluck( context.conversation.envelope.members, '_id' ));

                for (var i=0; i < this._notification.terminateConversation.length; i++){
                    this._notification.terminateConversation[i] = this._notification.terminateConversation[i].toString();
                }

                var i = tmp.indexOf(context.conversation.envelope.origin._id.toString());
                if (i !== -1) {
                    tmp.splice(i,1);
                }
                this._notification.terminateConversation = this._notification.terminateConversation.concat(tmp);
                break;
        }
    }

};

NotificationMessage.prototype.getNotification = function() {
    var tmp = JSON.parse(JSON.stringify(this._notification));

    return tmp;
};

NotificationMessage.prototype.getMessage = function() {
    return JSON.stringify(this._notification);
};