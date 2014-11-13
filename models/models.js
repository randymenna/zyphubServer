/**
 * Created by randy on 10/2/14.
 */
var conversation            = require('./conversation');
var profile                 = require('./profile');
var group                   = require('./group');
var escalation              = require('./escalation');
var auditTrail              = require('./auditTrail');


module.exports =  {
    Profile : profile.Profile,
    Group : group.Group,
    Conversation : conversation.Conversation,
    Escalation : escalation.Escalation,
    AuditTrail: auditTrail.AuditTrail
};
