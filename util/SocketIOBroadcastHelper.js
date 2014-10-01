/**
 * Created by al on 2/25/14.
 */
var gibiconstants = require('../constants');

var SocketIOBroadcastHelper = module.exports = function SocketIOBroadcastHelper() {

    this.setSocketIOEventPublisher = function(socketIOEventPublisher) {
        this._socketIOEventPublisher = socketIOEventPublisher;
    }

}

SocketIOBroadcastHelper.prototype.broadcastNewPosition = function(pet,locationReport) {
    var newPosition = {};
    newPosition.userId         = pet.owner.email;
    newPosition.data           = locationReport;

    if (!gibiconstants.isValidFix(locationReport)) {
        newPosition.topic = "noFixReported";
    }
    else {
        switch( locationReport.prefix ) {
            case "BG":
                newPosition.topic = "newPosition";
                break;
            case "BA":
                newPosition.topic = "batteryAlert";
                break;
            default :
                newPosition.topic = "newPosition";
                break;
        }
    }
    this._socketIOEventPublisher.publish("SocketIONotificationQueue", newPosition);
}

SocketIOBroadcastHelper.prototype.broadcastEvent = function(message,pet) {
    var evt = {};
    evt.userId         = pet.owner.email;

    switch( message.type.value ) {
        case gibiconstants.EVENT_TYPES.NEW_POSITION.value:

            if (!gibiconstants.isValidFix(message.currentLocation)) {
                evt.topic = "noFixReported";
            }
            else {
                evt.topic = "newPosition";
            }

            evt.data = message.currentLocation;
            break;

        case gibiconstants.EVENT_TYPES.LOW_BATTERY.value:
            evt.topic = "batteryAlert";
            evt.data = message.currentLocation;
            break;

        case gibiconstants.EVENT_TYPES.VIRTUAL_FENCE_BREACH.value:
        case gibiconstants.EVENT_TYPES.VIRTUAL_FENCE_ENTER.value:
            evt.topic = "zoneEvent";

            var status = pet.petStatus;
            status.petId = pet._id;
            status.location = message.currentLocation;

            evt.data  = status;
            break;

        case gibiconstants.EVENT_TYPES.LOCATE_PET.value:
        case gibiconstants.EVENT_TYPES.LOCATE_PET_RESULT_SUCCESS.value:
        case gibiconstants.EVENT_TYPES.LOCATE_PET_RESULT_FAIL.value:
        case gibiconstants.EVENT_TYPES.LOCATE_PET_TIMEOUT.value:

            evt.topic = "locatePet";

            var status = pet.petStatus;
            status.petId = pet._id;
            status.location = message.currentLocation;
            status.bgReports = message.bgReports;

            evt.data  = status;
            break;

        case gibiconstants.EVENT_TYPES.SHARE_PET_LOCATION.value:
        case gibiconstants.EVENT_TYPES.SHARE_PET_LOCATION_RESULT_SUCCESS.value:
        case gibiconstants.EVENT_TYPES.SHARE_PET_LOCATION_RESULT_FAIL.value:
        case gibiconstants.EVENT_TYPES.SHARE_PET_LOCATION_TIMEOUT.value:

            evt.topic = "sharePetLocation";

            var status      = pet.petStatus;
            status.petId    = pet._id;
            status.location = message.currentLocation;

            evt.data  = status;
            break;

        case gibiconstants.EVENT_TYPES.POWER_UP.value:
            evt.topic       = "powerUp";
            var status      = pet.petStatus;
            status.petId    = pet._id;
            status.location = message.currentLocation;
            evt.data  = status;

            break;

        case gibiconstants.EVENT_TYPES.POWER_DOWN.value:
            evt.topic       = "powerDown";
            var status      = pet.petStatus;
            status.petId    = pet._id;
            status.location = message.currentLocation;
            evt.data  = status;

            break;

        case gibiconstants.EVENT_TYPES.CHANGE_REPORTING_FREQUENCY.value:
        case gibiconstants.EVENT_TYPES.CHANGE_REPORTING_FREQUENCY_SUCCESS.value:
        case gibiconstants.EVENT_TYPES.CHANGE_REPORTING_FREQUENCY_FAIL.value:
            evt.topic       = "changeReportingFrequency";
            var status      = pet.petStatus;
            status.petId    = pet._id;
            status.reporting = message.reporting;
            //status.location = message.currentLocation;
            evt.data  = status;

            break;

        case gibiconstants.EVENT_TYPES.FULLY_CHARGED.value:
            evt.topic       = "fullyCharged";
            var status      = pet.petStatus;
            status.petId    = pet._id;
            status.location = message.currentLocation;
            evt.data  = status;

            break;

        case gibiconstants.EVENT_TYPES.TRACKING_SESSION_TIMEOUT.value:
            evt.topic = "trackingSession";
            var status = pet.petStatus;
            status.petId = pet._id;
            evt.data  = status;
            break;

        default :
            evt.topic = "userEvent";
            var status = pet.petStatus;
            status.petId = pet._id;
            evt.data  = status;
            break;
    }

    this._socketIOEventPublisher.publish("SocketIONotificationQueue", evt);
}


