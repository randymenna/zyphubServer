/**
 * Created by randy on 11/18/14.
 */
var model                   = require('../../../models/models');
var mongoose                = require('mongoose');
var moment                  = require('moment');

/*
    label:          String,

    schedule: {
        dates: [{
            start: Date, end: Date}
        ],
        dayTimes: [{
            days: String,
            startTime: Date,
            endTime: Date
        }]
    }

    enterprise: [String],
    owner: {profile id}

    meta: {}
 */

var days = [
    "sun","mon","tue","wed","thu","fri","sat"
];

var minutesOfDay = function(m){
    return m.minutes() + m.hours() * 60;
}

exports.fixDates = function( context ) {
    if ( context.schedule ) {
        for (var i = 0; i < context.schedule.dates.length; i++) {
            if (context.schedule.dates[i].start)
                context.schedule.dates[i].start = moment(context.schedule.dates[i].start).toDate();

            if (context.schedule.dates[i].end)
                context.schedule.dates[i].end = moment(context.schedule.dates[i].end).toDate();
        }
        for (var i = 0; i < context.schedule.dayTimes.length; i++) {
            if (context.schedule.dayTimes[i].startTime)
                context.schedule.dayTimes[i].startTime = moment(context.schedule.dayTimes[i].startTime,"h:ma").toDate();

            if (context.schedule.dayTimes[i].endTime)
                context.schedule.dayTimes[i].endTime = moment(context.schedule.dayTimes[i].endTime,"h:ma").toDate();
        }
    }

    return context;
}
exports.newTag = function( context, callback ) {

    context = exports.fixDates(context);
    var t = new model.Tag(context);

    return t;
};

exports.isActive = function( pTag ) {
    var dayTimeInRange = false;

    pTag.constraint = null;

    // check dates first
    var now = moment();
    var dateIndex = -1;

    for (var i=0; i < pTag.schedule.dates.length; i++) {
        var start = moment(pTag.schedule.dates[i].start);
        var end = moment(pTag.schedule.dates[i].end);

        if ( start.isBefore(now) && now.isBefore(end) ) {
            dateIndex = i;
            pTag.constraint = end.toDate();
            break;
        }
    }

    if ( dateIndex != -1 ) {
        var day = days[now.day()];

        if ( pTag.schedule.dayTimes[dateIndex].days.toLowerCase().indexOf(day) != -1 ) {

            var dayStart = false;
            if (pTag.schedule.dayTimes[i].startTime) {
                var start = moment(pTag.schedule.dayTimes[i].startTime);
                var now = moment();
                var todayStart = moment().hours(start.hours()).minutes(start.minutes()).seconds(start.seconds()).milliseconds(start.milliseconds());
                if (todayStart.isBefore(now)) {
                    dayStart = true;
                }
            }
            else {
                dayStart = true;
            }

            var dayEnd = false;
            if (pTag.schedule.dayTimes[i].endTime) {
                var end = moment(pTag.schedule.dayTimes[i].endTime);
                var now = moment();
                var todayEnd = moment().hours(end.hours()).minutes(end.minutes()).seconds(end.seconds()).milliseconds(end.milliseconds());
                if ( todayEnd.isAfter(now) ) {
                    dayEnd = true;
                    pTag.constraint = todayEnd.toDate();
                }
            }
            else {
                dayEnd = true;
            }

            if (dayStart && dayEnd)
                dayTimeInRange = true;
        }
    }
    else {
        dayTimeInRange = true;
    }

    return dayTimeInRange;
};
