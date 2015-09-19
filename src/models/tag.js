/**
 * Created by randy on 9/29/14.
 */
var mongoose                = require('mongoose');
var conversation            = require('./conversation');

var Schema  = mongoose.Schema;

var tagSchema = new Schema({

    context: { type: String, index: true, required: true },

    schedule: {
        dates: [{
            start: Date,
            end: Date,
            _id: false
        }],
        dayTimes: [{
            days: { type: String, lowercase: true, trim: true },
            startTime: Date,
            endTime: Date,
            _id: false
        }]
    },

    expires: Date,

    owner: [{type: Schema.Types.ObjectId, ref: 'Profiles', index: true}],
    enterprise: {type: String, default: 'ConversePoint'},

    meta: {}
    });

tagSchema.pre('save',function(next, done) {
    var self = this;

    next();
});

var _Tag = mongoose.model('Tags', tagSchema);

module.exports =  {
    Tag : _Tag
};
