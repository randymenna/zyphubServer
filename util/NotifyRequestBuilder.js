/**
 * Created by al on 1/6/14.
 */

var cpConstants = require('../constants');


var NotifyRequestBuilder = module.exports = function NotifyRequestBuilder() {};

NotifyRequestBuilder.prototype.buildBaseEvent = function (originalMessage, petDevice) {

    //TODO: WE NEED TO REFACTOR THIS BASED ON EVENT TYPE,
    //      OTHERWISE, THE EVENT IS GOING TO HAVE EXTRANEOUS AND MISLEADING

    var eventType                    = originalMessage.type;
    var notificationMediumContactMap = {};

    // loop thru all notification medium types
    for (var notificationMediumKey in cpConstants.NOTIFICATION_MEDIUM_TYPES) {

        var contactsForNotificationMedium = [];

        var notificationMedium              = cpConstants.NOTIFICATION_MEDIUM_TYPES[notificationMediumKey];

        // if the event is a user's request to share pet's location, use the contacts
        // specified in the actual event object
        if (cpConstants.isSharePetLocationEvent(eventType)) {
            if (originalMessage.contacts != null) {
                for (var j=0;j<originalMessage.contacts.length;j++) {
                    contactsForNotificationMedium.push(originalMessage.contacts[j]);
                }
            }
        } else {
            if (petDevice.contacts != null) {
                for (var j=0;j<petDevice.contacts.length;j++) {
                    contactsForNotificationMedium.push(petDevice.contacts[j]);
                }
            }
        }
        notificationMediumContactMap[notificationMedium.name] = contactsForNotificationMedium;
    }

    var notifyRequest = {};

    notifyRequest.eventType                     = originalMessage.type;
    notifyRequest.type                          = originalMessage.type;
    notifyRequest.currentLocation               = originalMessage.currentLocation;
    notifyRequest.previousLocation              = originalMessage.previousLocation;
    if ( notifyRequest.currentLocation == null )
        notifyRequest.currentLocation = notifyRequest.previousLocation;
    notifyRequest.accountId                     = petDevice.accountId;
    notifyRequest.deviceId                      = petDevice.device.deviceId;
    notifyRequest.petId                         = petDevice._id;
    notifyRequest.petName                       = petDevice.petName;
    notifyRequest.petDeviceOwner                = petDevice.owner;
    notifyRequest.timeStamp                     = (new Date).getTime();
    //if (petDevice.virtualfence !== undefined && petDevice.virtualfence != null) {
    if (petDevice.virtualfence != null) {
        notifyRequest.virtualFenceName              = petDevice.virtualfence.name;
    }

    if (petDevice.device != null) {
        notifyRequest.device = petDevice.device;
    }

    if (petDevice.device != null && petDevice.device.mdn != null) {
        notifyRequest.mdn = petDevice.device.mdn;
    }

    if ( eventType.value == cpConstants.EVENT_TYPES.CHANGE_REPORTING_FREQUENCY.value ) {
        notifyRequest.requestId = guid();
        notifyRequest.currentLocation               = null;
        notifyRequest.previousLocation              = null;
    }

    if ( eventType.value == cpConstants.EVENT_TYPES.CHANGE_REPORTING_FREQUENCY_FAIL.value ) {
        notifyRequest.reporting = originalMessage.reporting;
    }

    notifyRequest.notificationMediumContactMap  = notificationMediumContactMap;

   return notifyRequest;
};

function guid() {
    function _p8(s) {
        var p = (Math.random().toString(16)+"000000000").substr(2,8);
        return s ? "-" + p.substr(0,4) + "-" + p.substr(4,4) : p ;
    }
    return _p8() + _p8(true) + _p8(true) + _p8();
}


