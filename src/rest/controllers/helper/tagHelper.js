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
    'sun','mon','tue','wed','thu','fri','sat'
];

var minutesOfDay = function(m){
    return m.minutes() + m.hours() * 60;
};

exports.fixDates = function( context ) {
    var noDates = true;
    var noDayTimes = true;
    if ( context.schedule ) {
        if ( context.schedule.dates ) {
            noDates = false;
            for (var i = 0; i < context.schedule.dates.length; i++) {
                if (context.schedule.dates[i].start)
                    context.schedule.dates[i].start = moment(context.schedule.dates[i].start).toDate();

                if (context.schedule.dates[i].end)
                    context.schedule.dates[i].end = moment(context.schedule.dates[i].end).toDate();
            }
        }
        if ( context.schedule.dayTimes ) {
            noDayTimes = false;
            for (var i = 0; i < context.schedule.dayTimes.length; i++) {
                if (context.schedule.dayTimes[i].startTime)
                    context.schedule.dayTimes[i].startTime = moment(context.schedule.dayTimes[i].startTime, 'h:ma').toDate();

                if (context.schedule.dayTimes[i].endTime)
                    context.schedule.dayTimes[i].endTime = moment(context.schedule.dayTimes[i].endTime, 'h:ma').toDate();
            }
        }
    }

    if ( noDates && noDayTimes )
        delete context.schedule;

    return context;
};
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

    if ( dateIndex !== -1 ) {
        var day = days[now.day()];

        if ( pTag.schedule.dayTimes[dateIndex].days.toLowerCase().indexOf(day) !== -1 ) {

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

exports.sanitize = function( tag ) {


    function clean( t ) {

        delete t.__v;
        delete t.owner;

        if ((!t.schedule.dayTimes.length || t.schedule.dayTimes.length && !t.schedule.dayTimes[0]) && !t.schedule.dates.length) {
            delete t.schedule;
        }
        else if (!t.schedule.dayTimes.length || t.schedule.dayTimes.length && !t.schedule.dayTimes[0]) {
            delete t.schedule.dayTimes;
        }
        else
        if (!t.schedule.dates.length ) {
            delete t.schedule.dates;
        }

        return t;
    }

    if ( tag instanceof Array )
        for(var i=0; i < tag.length; i++ ) {
            tag[i] = clean( tag[i].toObject());
        }
    else
    if (tag)
        tag = clean(tag.toObject());

    return tag;
};

exports.getAll = function (context, callback) {
    model.Tag.find(context.search).exec(function( err, tags){
        if ( err ) {
            callback(err, null);
        }
        else {
            context.tags = exports.sanitize(tags);
            callback(null, context);
        }
    });
};

exports.getOne = function (context, callback) {
    model.Tag.findOne(context.search).exec(function( err, tag){
        if ( err ) {
            callback(err, null);
        }
        else {
            context.tag = exports.sanitize( tag );
            callback(null, context);
        }
    });
};

exports.updateOne = function (context, callback) {
    model.Tag.findOneAndUpdate(context.search,context.update,{'new': true}).exec(function( err, tag){
        if ( err ) {
            callback(err, null);
        }
        else {
            context.tag = exports.sanitize( tag );
            callback(null, context);
        }
    });
};

exports.removeAll = function (context, callback) {
    model.Tag.remove(context.search).exec(function( err, tag){
        if ( err ) {
            callback(err, null);
        }
        else {
            context.tag =  { numRemoved: tag };
            callback(null, context);
        }
    });
};

exports.removeOne = function (context, callback) {
    model.Tag.findOneAndRemove(context.search).exec(function( err, tag){
        if ( err ) {
            callback(err, null);
        }
        else {
            context.tag = exports.sanitize( tag );
            callback(null, context);
        }
    });
};