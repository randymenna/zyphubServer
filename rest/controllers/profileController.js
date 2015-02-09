/**
 * Created by randy on 9/4/14.
 */

var async                   = require('async');
var genericMongoController  = require('./genericMongoController')
var profile                 = require('../../models/profile');
var model                   = require('../../models/models');
var mongoose                = require('mongoose');
var profileHelper           = require('./helper/profileHelper');
var ConversationHelper      = require('./helper/conversationHelper');

var ObjectId = mongoose.Types.ObjectId;
var conversationHelper = new ConversationHelper();

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
                profile.Profile.find().exec(function( err, profiles){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.profiles = profiles;

                        for (var i=0; i < profiles.length; i++ )
                            context.profiles[i] = profileHelper.santize( profiles[i].toObject() );

                        callback(null, context);
                    }
                })
            } /*,

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
            */
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

    console.log("getOneProfile(): entered");
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
                profile.Profile.findOne({_id:context.id}).exec(function( err, profile){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.profile = profileHelper.santize( profile.toObject() );
                        callback(null, context);
                    }
                })
            }
        ],

        function (err, context) {
            console.log("getOneProfile(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.profile);
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

                var info = {}
                info.name = req.body.name;
                info.label = req.body.label;

                var p = profileHelper.newProfile(info);

                p.save(function( err, profile){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.profile = profileHelper.santize( profile.toObject() );
                        callback(null, context);
                    }
                });
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
                model.Profile.findOne({'_id': context.profileId})
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

                conversationHelper.getConversationsInInbox( context.inbox, function( err, conversations){
                    context.conversations = conversationHelper.sanitize( conversations );
                    callback( err, context );
                });
                /*
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
                    */
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

exports.update = function (req, res) {

    console.log("profiles.update(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.search = {};
                context.search._id = ObjectId(req.params.id);

                callback(null, context);
            },
            function (context, callback) {
                model.Profile.findOneAndUpdate(context.search,context.update).exec(function( err, profile){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.profile = profileHelper.santize( profile.toObject() );
                        callback(null, context);
                    }
                })
            }
        ],

        function (err, context) {
            console.log("profile.update(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.profile);
            } else {
                res.json(401, err);
            }
        }
    );
};

exports.remove = function (req, res) {

    console.log("profile.remove(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.search = {};
                context.search._id = ObjectId(req.params.id);

                callback(null, context);
            },
            function (context, callback) {
                model.Profile.findOneAndRemove(context.search).exec(function( err, profile){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.profile = profileHelper.santize( profile.toObject() );
                        callback(null, context);
                    }
                })
            }
        ],

        function (err, context) {
            console.log("profile.remove(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.tag);
            } else {
                res.json(401, err);
            }
        }
    );
};