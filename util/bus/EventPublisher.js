/**
 * Created by al on 3/21/14.
 */

var cpconstants = require('../../constants');
//var EventService  = require('../../service/EventService');

//var eventService = new EventService();

var EventPublisher = module.exports = function EventPublisher(eventExchangePublisher) {
    this._eventExchangePublisher = eventExchangePublisher;
};

EventPublisher.prototype.publishNewPosition = function(pet,currentLocationReport) {
    this.publishEvent(cpconstants.EVENT_TYPES.NEW_POSITION,pet,currentLocationReport);
};

EventPublisher.prototype.publishVFBreachEvent = function(pet,currentLocationReport) {
    this.publishEvent(cpconstants.EVENT_TYPES.VIRTUAL_FENCE_BREACH,pet,currentLocationReport);
};

EventPublisher.prototype.publishVFEnterEvent = function(pet,currentLocationReport) {
    this.publishEvent(cpconstants.EVENT_TYPES.VIRTUAL_FENCE_ENTER,pet,currentLocationReport);
};

EventPublisher.prototype.publishLowBatteryEvent = function(pet,currentLocationReport) {
    this.publishEvent(cpconstants.EVENT_TYPES.LOW_BATTERY,pet,currentLocationReport);
};

EventPublisher.prototype.publishVFBreachCancelEvent = function(pet,currentLocationReport) {
    this.publishEvent(cpconstants.EVENT_TYPES.VF_BREACH_CANCEL,pet,currentLocationReport);
};

EventPublisher.prototype.publishTrackingSessionStartEvent = function(pet,currentLocationReport) {
    this.publishEvent(cpconstants.EVENT_TYPES.TRACKING_SESSION_START,pet,currentLocationReport);
};

EventPublisher.prototype.publishFoundPetEvent = function(pet,currentLocationReport) {
    this.publishEvent(cpconstants.EVENT_TYPES.PET_FOUND,pet,currentLocationReport);
};

EventPublisher.prototype.publishLookingForPetEvent = function(pet,currentLocationReport) {
    this.publishEvent(cpconstants.EVENT_TYPES.LOOKING_FOR_PET,pet,currentLocationReport);
};

EventPublisher.prototype.publishLocatePetEvent = function(pet) {
    this.publishEvent(cpconstants.EVENT_TYPES.LOCATE_PET,pet,null);
};

EventPublisher.prototype.publishSleepModeRequestEvent = function(pet,sleepModeArgs,currentLocationReport) {
    var event            = this.buildBaseEvent(cpconstants.EVENT_TYPES.SLEEP_MODE_REQUEST,pet,currentLocationReport);
    event.sleepModeArgs  = sleepModeArgs;
    this.reallyPublishEvent(event);
};

EventPublisher.prototype.publishChangeReportingFrequencyEvent = function(pet) {
    this.publishEvent(cpconstants.EVENT_TYPES.CHANGE_REPORTING_FREQUENCY,pet,null);
};

EventPublisher.prototype.publishChangeReportingFrequencyReplyEvent = function(bgi,publisher) {
    var evt;

    if ( bgi.status )
        evt = cpconstants.EVENT_TYPES.CHANGE_REPORTING_FREQUENCY_SUCCESS;
    else
        evt = cpconstants.EVENT_TYPES.CHANGE_REPORTING_FREQUENCY_FAIL;

    eventService.findByRequestId( bgi.responseId, function( err, retVal ){
        if ( !retVal ) {
            console.log("BGI return failure: cannot find requestId: " + bgi.requestId);
        }
        else {
            var event       = publisher.buildBasePetlessEvent(evt, retVal.petId);
            event.reporting = {};
            event.reporting.setToFrequency = bgi.setting;
            publisher._eventExchangePublisher.publish('NotificationEngineQueue',JSON.stringify(event));
        }
    })
};

EventPublisher.prototype.publishLocatePetSuccessEvent = function(pet, currentLocationReport) {
    this.publishEvent(cpconstants.EVENT_TYPES.LOCATE_PET_RESULT_SUCCESS,pet,currentLocationReport);
};

EventPublisher.prototype.publishLocatePetFailureEvent = function(pet, currentLocationReport) {
    this.publishEvent(cpconstants.EVENT_TYPES.LOCATE_PET_RESULT_FAIL,pet,currentLocationReport);
};

EventPublisher.prototype.publishSharePetLocationSuccessEvent = function(pet, currentLocationReport) {
    this.publishEvent(cpconstants.EVENT_TYPES.SHARE_PET_LOCATION_RESULT_SUCCESS,pet,currentLocationReport);
};

EventPublisher.prototype.publishSharePetLocation = function(pet, currentLocationReport, contacts) {
    var event       = this.buildBaseEvent(cpconstants.EVENT_TYPES.SHARE_PET_LOCATION,pet,currentLocationReport);
    event.contacts  = contacts;
    this.reallyPublishEvent(event);
};

EventPublisher.prototype.publishSharePetLocationFailureEvent = function(pet, currentLocationReport) {
    this.publishEvent(cpconstants.EVENT_TYPES.SHARE_PET_LOCATION_RESULT_FAIL,pet,currentLocationReport);
};

EventPublisher.prototype.publishPowerUpEvent = function(pet, currentLocationReport) {
    this.publishEvent(cpconstants.EVENT_TYPES.POWER_UP,pet,currentLocationReport);
};

EventPublisher.prototype.publishPowerDownEvent = function(pet, currentLocationReport) {
    this.publishEvent(cpconstants.EVENT_TYPES.POWER_DOWN,pet,currentLocationReport);
};

EventPublisher.prototype.publishFullyChargedEvent = function(pet,currentLocationReport) {
    this.publishEvent(cpconstants.EVENT_TYPES.FULLY_CHARGED,pet,currentLocationReport);
}

EventPublisher.prototype.publishEvent = function(eventType,pet,currentLocationReport) {
    var event = this.buildBaseEvent(eventType,pet,currentLocationReport);
    this.reallyPublishEvent(event);
}

EventPublisher.prototype.publishResetPassword = function(user, password) {
    var event        = {};
    event.eventType       = cpconstants.EVENT_TYPES.RESET_PASSWORD;
    event.user       = user;
    event.password   = password;

    this._eventExchangePublisher.publish('OutboundEmailQueue',JSON.stringify(event));
};


EventPublisher.prototype.buildBaseEvent = function(eventType,pet,currentLocationReport) {
    var event               = {};
    event.type              = eventType;
    event.petId             = pet._id;

    if (currentLocationReport == null) {
        event.currentLocation   = pet.latestKnownLocation;
        event.previousLocation  = null;
    }
    else {
        event.currentLocation   = currentLocationReport;
        event.previousLocation  = pet.latestKnownLocation;
    }
    return event;
}

EventPublisher.prototype.buildBasePetlessEvent = function(eventType,pet) {
    var event               = {};
    event.type              = eventType;
    event.petId             = pet;
    event.previousLocation  = null;
    event.currentLocation   = null;
    return event;
}

EventPublisher.prototype.reallyPublishEvent = function(event) {
    this._eventExchangePublisher.publish('NotificationEngineQueue',JSON.stringify(event));
}