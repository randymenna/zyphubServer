/**
 * Created by randy on 12/16/13.
 */


module.exports.SYSTEM_GUID = 'internal-system-origin-cp-10-17-2005';

module.exports.NOTIFICATION_TYPES = {
  NEW : 'NEW',
    READ: 'READ',
    REPLY: 'REPLY',
    OK: 'OK',
    ACCEPT: 'ACCEPT',
    REJECT: 'REJECT',
    ESCALATE: 'ESCALATE',
    CLOSE: 'CLOSE',
    LEAVE: 'LEAVE',
    FORWARD: 'FORWARD',
    DELEGATE: 'DELEGATE'
};

module.exports.PROFILE_CONVERSATION_STATES = {
  UNREAD : 'UNREAD',
  LEFT : 'LEFT',
  ACCEPTED : 'ACCEPTED',
  REJECTED : 'REJECTED',
  OK : 'OK',
  CLOSED: 'CLOSED',
  DELEGATED: 'DELEGATED',
  REMOVED: 'REMOVED'
};

module.exports.BUS = {
  DIRECT                : 'direct',
  FANOUT                : 'fanout',
  CONVERSATION_WORKERS  : 1,
  AUDIT_WORKERS         : 1,
  SCHEDULE_WORKERS      : 1,
  CONVERSATION_ROUTER   : 'ConversationRouter',
  SCHEDULER             : 'Scheduler',
  NOTIFIER              : 'Notifier',
  AUDITTRAIL            : 'AuditTrai'
};
