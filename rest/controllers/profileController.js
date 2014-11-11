/**
 * Created by al on 9/4/14.
 */

var async                   = require('async');
var genericMongoController  = require('./genericMongoController')
var profile                 = require('../../models/profile');
var model                   = require('../../models/models');
var mongoose                = require('mongoose');

exports.getProfiles = function (req, res) {

    console.log("getProfiles(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};
                var accountId = genericMongoController.extractAccountId(req);
                context.accountId = accountId;
                console.log("getProfiles(): accountId=%s", accountId);
                callback(null, context);
            },
            function (context, callback) {
                profile.Person.find().exec(function( err, people){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.profiles = people;
                        callback(null, context);
                    }
                })
            },

            function (context, callback) {
                model.Group.find().exec(function( err, groups){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.profiles.concat(groups);
                        callback(null, context);
                    }
                })
            }
        ],

        function (err, context) {
            console.log("getProfiles(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context);
            } else {
                res.json(401, err);
            }
        }
    );
};

exports.getOneProfile = function (req, res) {

    console.log("getProfiles(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};
                var accountId = genericMongoController.extractAccountId(req);
                context.accountId = accountId;
                context.id = req.params.id;
                console.log("getProfiles(): accountId=%s", accountId);
                callback(null, context);
            },
            function (context, callback) {
                profile.Person.find({_id:context.id}).exec(function( err, person){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.person = person;
                        callback(null, context);
                    }
                })
            }
        ],

        function (err, context) {
            console.log("getProfiles(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.person);
            } else {
                res.json(401, err);
            }
        }
    );
};

exports.newProfile = function (req, res) {

    console.log("newProfile(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};
                var accountId = genericMongoController.extractAccountId(req);
                context.accountId = accountId;
                console.log("getProfiles(): accountId=%s", accountId);
                callback(null, context);
            },

            function (context, callback) {
                var stringId = mongoose.Types.ObjectId().toHexString();
                stringId = 'a' + stringId.substring(1);
                var _id = mongoose.Types.ObjectId( stringId );

                var p = new profile.Person({
                            _id: _id,
                            name:req.body.name,
                            label:req.body.label
                        });

                p.save(function( err, profile){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.profile = profile;
                        callback(null, context);
                    }
                })
            }
        ],

        function (err, context) {
            console.log("newProfile(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.profile);
            } else {
                res.json(400, err.message);
            }
        }
    );
};

exports.getConversations = function (req, res) {

    console.log("getConversations(): entered");

    async.waterfall(
        [
            function (callback) {
                var context = {};
                var accountId = genericMongoController.extractAccountId(req);

                context.accountId = accountId;
                context.profileId = req.params.id;

                callback(null, context);
            },

            // get all the conversations for a user
            function(context,callback) {
                model.Person.findOne({'_id': context.profileId}, {_id: 0, inbox: 1})
                    .exec(function (err, obj) {
                        if ( err ) {
                            callback(err, null);
                        }
                        else {
                            context.inbox = obj.inbox;
                            callback(null, context);
                        }
                    });
            },

            function(context,callback) {
                model.Conversation.find({'_id': { $in: context.inbox }})
                    .populate('envelope.origin', 'label _id')
                    .populate('envelope.members', 'label _id')
                    .populate('stats.members.member', 'label')
                    .exec(function( err, conversations){
                        if ( err ) {
                            callback(err, null);
                        }
                        else {
                            context.conversations = conversations;
                            callback(null, context);
                        }
                    });
            }
        ],

        function (err, context) {
            console.log("getConversations(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.conversations);
            } else {
                res.json(401, err.message);
            }
        }
    );
};

