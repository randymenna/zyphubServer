/**
 * Created by randy on 1/22/15.
 */
var NotificationMessage = module.exports = function NotificationMessage() {
    this._notification = {};
}

NotificationMessage.prototype.setConversationId = function( id ) {
    this._notification.conversation = id;
}

NotificationMessage.prototype.setType = function( type, origin ) {
    this._notification.notification = {};
    this._notification.notification.type = type;
    this._notification.notification.origin = origin;
}

NotificationMessage.prototype.setEnvelope = function( envelope ) {
    this._notification.envelope = {};
    this._notification.envelope.origin = envelope.origin._id;
    this._notification.envelope.members = envelope.members.slice(0);
    this._notification.envelope.messageType = envelope.pattern;
    this._notification.envelope.priority = envelope.priority;
    this._notification.envelope.tags = envelope.tags.slice(0);
}

NotificationMessage.prototype.setContent = function( content ) {
    this._notification.content = {};
    this._notification.content.message = content.message;
    this._notification.content.replies = content.replies.slice(0);
}

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
    this._notification.state.members                = state.members.slice(0);
}

NotificationMessage.prototype.getMessage = function() {
    return JSON.stringify(this._notification);
}