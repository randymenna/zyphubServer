/**
 * Created by randy on 10/2/14.
 */
var conversation            = require('./conversation');
var profile                 = require('./profile');
var escalation              = require('./escalation');
var audit                   = require('./audit');


module.exports =  {
    Person : profile.Person,
    Group : profile.Group,
    Conversation : conversation.Conversation,
    Escalation : escalation.Escalation,
    Audit: audit.Audit
};
