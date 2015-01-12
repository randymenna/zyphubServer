/**
 * Created by randy on 9/4/14.
 */

var async                   = require('async');
var genericMongoController  = require('./genericMongoController')
var tag                     = require('../../models/tag');
var model                   = require('../../models/models');
var mongoose                = require('mongoose');
var tagHelper               = require('./helper/tagHelper');

var ObjectId = mongoose.Types.ObjectId;

/*
app.post('/', passport.authenticate('bearer', { session: false }), TagController.newTag);
app.get('/', passport.authenticate('bearer', { session: false }), TagController.getAll);
app.get('/:id', passport.authenticate('bearer', { session: false }), TagController.getOne);
app.put('/:id', passport.authenticate('bearer', { session: false }),TagController.update);
app.delete('/:id', passport.authenticate('bearer', { session: false }),TagController.remove);

---------------
 label: String,
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
 expires: Date,
 owner: [{type: Schema.Types.ObjectId, ref: 'Profiles'}],
 enterprise: [String],
 meta: {}
-----------------
*/

exports.newTag = function (req, res) {

    console.log("newTag(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = req.body;
                context.owner = req.user.origin;

                callback(null, context);
            },

            function (context, callback) {

                var t = tagHelper.newTag(context);

                t.save(function( err, tag){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.tag = tag.toObject();
                        delete context.tag.__v;
                        delete context.tag.owner;

                        callback(null, context);
                    }
                });
            }
        ],

        function (err, context) {
            console.log("newTag(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.tag);
            } else {
                res.json(400, err.message);
            }
        }
    );
};

/*
    {
        enterprise: {profileId}
    }
 */

exports.getAll = function (req, res) {

    console.log("tags.getAll(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.search = {}
                context.search.owner = req.user.origin;

                if ( req.body.enterprise ) {
                    context.search.enterprise = req.body.enterprise;
                }

                callback(null, context);
            },
            function (context, callback) {
                tag.Tag.find(context.search).exec(function( err, tags){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.tags = tags;
                        for(var i=0; i< context.tags.length; i++) {
                            context.tags[i] = tags[i].toObject();
                            delete context.tags[i].__v;
                            delete context.tags[i].owner;
                        }
                        callback(null, context);
                    }
                })
            }
        ],

        function (err, context) {
            console.log("tags.getAll(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.tags);
            } else {
                res.json(401, err);
            }
        }
    );
};

exports.getOne = function (req, res) {

    console.log("tags.getOne(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.search = {};
                context.search._id = ObjectId(req.params.id);
                context.search.owner = req.user.origin;

                callback(null, context);
            },
            function (context, callback) {
                tag.Tag.findOne(context.search).exec(function( err, tag){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.tag = tag.toObject();
                        delete context.tag.__v;
                        delete context.tag.owner;

                        callback(null, context);
                    }
                })
            }
        ],

        function (err, context) {
            console.log("tags.getOne(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.tags);
            } else {
                res.json(401, err);
            }
        }
    );
};

exports.update = function (req, res) {

    console.log("tags.update(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.search = {};
                context.search._id = ObjectId(req.params.id);
                context.update = tagHelper.fixDates(req.body);

                callback(null, context);
            },
            function (context, callback) {
                tag.Tag.findOneAndUpdate(context.search,context.update).exec(function( err, tag){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.tag = tag.toObject();
                        delete context.tag.__v;
                        delete context.tag.owner;
                        callback(null, context);
                    }
                })
            }
        ],

        function (err, context) {
            console.log("tags.update(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.tag);
            } else {
                res.json(401, err);
            }
        }
    );
};

exports.remove = function (req, res) {

    console.log("tags.remove(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.search = {};
                context.search._id = ObjectId(req.params.id);

                callback(null, context);
            },
            function (context, callback) {
                tag.Tag.findOneAndRemove(context.search).exec(function( err, tag){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.tag = tag.toObject();
                        delete context.tag.__v;
                        delete context.tag.owner;
                        callback(null, context);
                    }
                })
            }
        ],

        function (err, context) {
            console.log("tags.remove(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.tag);
            } else {
                res.json(401, err);
            }
        }
    );
};