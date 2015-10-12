/**
 * Created by randy on 9/4/14.
 */

var async                   = require('async');
var profile                 = require('../../models/profile');
var model                   = require('../../models/models');
var mongoose                = require('mongoose');
var profileHelper           = require('./helper/profileHelper');
var ConversationHelper      = require('./helper/conversationHelper');

var conversationHelper = new ConversationHelper();

exports.getProfiles = function (req, res) {

    console.log('getProfiles(): entered');
    async.waterfall(
        [
            function (callback) {
                var context = {};
                var accountId = req.user.origin;
                context.accountId = accountId;
                console.log('getProfiles(): accountId=%s', accountId);
                callback(null, context);
            },
            function (context, callback) {
                profile.Profile.find().select('displayName memberOf enterprise presence').exec(function( err, profiles){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.profiles = profiles;

                        for (var i=0; i < profiles.length; i++ ) {
                            context.profiles[i] = profileHelper.sanitize(profiles[i].toObject());
                        }

                        callback(null, context);
                    }
                });
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
            console.log('getProfiles(): exiting: err=%s,result=%s', err, context);
            if (!err) {
                res.status(200).json(context);
            } else {
                res.status(401).json(err);
            }
        }
    );
};

exports.getOneProfile = function (req, res) {

    console.log('getOneProfile(): entered');
    async.waterfall(
        [
            function (callback) {
                var context = {};
                var accountId = req.user.origin;
                context.accountId = accountId;
                context.id = req.params.id;
                console.log('getProfiles(): accountId=%s', accountId);
                callback(null, context);
            },
            function (context, callback) {
                profile.Profile.findOne({_id:context.id}).exec(function( err, profile){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.profile = profileHelper.sanitize( profile.toObject() );
                        callback(null, context);
                    }
                });
            }
        ],

        function (err, context) {
            console.log('getOneProfile(): exiting: err=%s,result=%s', err, context);
            if (!err) {
                res.status(200).json(context.profile);
            } else {
                res.status(401).json(err);
            }
        }
    );
};

exports.newProfile = function (req, res) {

    console.log('newProfile(): entered');
    async.waterfall(
        [
            function (callback) {
                var context = {};
                var accountId = req.user.origin;
                context.accountId = accountId;
                console.log('getProfiles(): accountId=%s', accountId);
                callback(null, context);
            },

            function (context, callback) {

                var info = {};
                info.name = req.body.name;
                info.label = req.body.label;

                profileHelper.newProfile(info, function( err, p){
                    if ( err ) {
                        callback(Error('profile create failue'), null);
                    }
                    else {
                        p.save(function (err, profile) {
                            if (err) {
                                callback(err, null);
                            }
                            else {
                                context.profile = profileHelper.santize(profile.toObject());
                                callback(null, context);
                            }
                        });
                    }
                });
            }
        ],

        function (err, context) {
            console.log('newProfile(): exiting: err=%s,result=%s', err, context);
            if (!err) {
                res.status(200).json(context.profile);
            } else {
                res.status(400).json(err.message);
            }
        }
    );
};

exports.getConversations = function (req, res) {

    console.log('getConversations(): entered');

    async.waterfall(
        [
            function (callback) {
                var context = {};
                var accountId = req.user.origin;

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

                conversationHelper.getConversationsInInbox( context, callback );
            }
        ],

        function (err, context) {
            console.log('getConversations(): exiting: err=%s,result=%s', err, context.conversations);
            if (!err) {
                res.status(200).json(context.conversations);
            } else {
                res.status(400).json(err.message);
            }
        }
    );
};

exports.update = function (req, res) {

    console.log('profiles.update(): entered');
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.search = {};
                context.search._id = mongoose.Type.ObjectId(req.params.id);
                context.update = profileHelper.getUpdate( req.body );

                callback(null, context);
            },
            function (context, callback) {
                model.Profile.findOneAndUpdate(context.search,context.update,{'new': true}).exec(function( err, profile){
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
            console.log('profile.update(): exiting: err=%s,result=%s', err, context);
            if (!err) {
                res.status(200).json(context.profile);
            } else {
                res.status(401).json(err);
            }
        }
    );
};

exports.remove = function (req, res) {

    console.log('profile.remove(): entered');
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.search = {};
                context.search._id = mongoose.Type.ObjectId(req.params.id);

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
                });
            }
        ],

        function (err, context) {
            console.log('profile.remove(): exiting: err=%s,result=%s', err, context);
            if (!err) {
                res.status(200).json(context.tag);
            } else {
                res.status(401).json(err);
            }
        }
    );
};