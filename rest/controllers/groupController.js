/**
 * Created by al on 9/4/14.
 */

var async                   = require('async');
var mongoose                = require('mongoose');
var genericMongoController  = require('./genericMongoController')
var model                   = require('../../models/models');

exports.getGroups = function (req, res) {

    console.log("getGroups(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};
                var accountId = genericMongoController.extractAccountId(req);
                context.accountId = accountId;
                console.log("getGroups(): accountId=%s", accountId);
                callback(null, context);
            },
            function (context, callback) {
                model.Group.find().exec(function( err, groups){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.groups = groups;
                        callback(null, context);
                    }
                })
            }
        ],

        function (err, context) {
            console.log("getGroups(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.groups);
            } else {
                res.json(401, err);
            }
        }
    );
};

exports.getOneGroup = function (req, res) {

    console.log("getGroups(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};
                var accountId = genericMongoController.extractAccountId(req);
                context.accountId = accountId;
                context._id = req.params.id;
                console.log("getGroups(): _id=%s", context._id);
                callback(null, context);
            },
            function (context, callback) {
                model.Group.findOne({_id: context._id})
                    .populate('owner', 'label id')
                    .populate('members', 'label id')
                    .exec(function( err, group){
                        if ( err ) {
                            callback(err, null);
                        }
                        else {
                            context.group = group;
                            callback(null, context);
                        }
                    });
            }
        ],

        function (err, context) {
            console.log("getGroups(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.group);
            } else {
                res.json(401, err);
            }
        }
    );
};

exports.newGroup = function (req, res) {

    console.log("newGroup(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};
                var accountId = genericMongoController.extractAccountId(req);
                context.accountId = accountId;
                console.log("newGroup(): accountId=%s", accountId);

                context.name = req.body.name;
                context.label = req.body.label;
                context.members = req.body.members;
                context.owner = req.body.owner;

                callback(null, context);
            },

            function (context, callback) {
                var stringId = mongoose.Types.ObjectId().toHexString();
                stringId = 'b' + stringId.substring(1);
                var _id = mongoose.Types.ObjectId( stringId );

                var g = new model.Group({
                    _id: _id,
                    name: context.name,
                    label: context.label,
                    members: context.members,
                    owner: context.owner
                });

                g.save(function( err, group){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.group = group;
                        callback(null, context);
                    }
                })
            },

            function(context,callback){

                // add group id to member's memberOf
                model.Profile.update({'_id': { $in: context.group.members }},{$push:{'memberOf' : context.group._id}},{multi:true},function(err,ret){
                    callback(err,context);
                });
            }
        ],

        function (err, context) {
            console.log("newGroup(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.group);
            } else {
                res.json(400, err.message);
            }
        }
    );
};


exports.joinGroup = function (req, res) {

    console.log("joinGroup(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};
                var accountId = genericMongoController.extractAccountId(req);
                context.accountId = accountId;
                context.groupId = req.params.id;
                context.profileId = req.body.id;

                console.log("joinGroup(): group=%s profile=%", context.groupId, context.profileId);
                callback(null, context);
            },

            // add member id to group members
            function (context, callback) {

                model.Group.findOneAndUpdate({'_id': context.groupId},{$push:{'members' : context.profileId}},function(err,ret){
                    context.group = ret;
                    callback(err,context);
                });
            },

            // add group id to member's memberOf
            function (context, callback) {

                model.Profile.findOneAndUpdate({'_id': context.profileId},{$push:{'memberOf' : context.groupId}},function(err,ret){
                    callback(err,context);
                });
            },


            // add the new member to all the conversations
            function (context, callback) {

                model.Conversation.find({"envelope.meta.groups": context.groupId}, function(err, conversations){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.conversationIds = [];
                        var functions = [];

                        for (var i=0; i < conversations.length; i++) {
                            context.conversationIds.push(conversations[i]._id.toHexString());
                            conversations[i].envelope.members.push( context.profileId );
                            conversations[i].state.members.push( {member: context.profileId, state: "UNOPENED"} );
                            ++conversations[i].state.curMemberCount;

                            functions.push((function (doc) {
                                return function (callback) {
                                    doc.save(callback);
                                };
                            })(conversations[i]));
                        }

                        context.conversations = conversations;

                        if (context.conversations.length > 0) {

                            async.parallel(functions, function (err, results) {
                                callback(err,context);
                            });
                        }
                        else {
                            callback(null,context);
                        }
                    }
                });
            },

            // add the open group conversations to the new members inbox
            function (context, callback) {

                if (context.conversations.length > 0) {

                    model.Profile.findOneAndUpdate({'_id': context.profileId},{$pushAll:{'inbox' : context.conversationIds}},function(err,ret){
                        callback(err,context);
                    });
                }
                else {
                    callback(null,context);
                }
            }
        ],

        function (err, context) {
            console.log("joinGroup(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.group);
            } else {
                res.json(400, err.message);
            }
        }
    );
};

exports.leaveGroup = function (req, res) {

    console.log("leaveGroup(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};
                var accountId = genericMongoController.extractAccountId(req);
                context.accountId = accountId;
                context.groupId = req.params.id;
                context.profileId = req.body.id;

                console.log("leaveGroup(): group=%s profile=%", context.groupId, context.profileId);
                callback(null, context);
            },

            // add member id to group members
            function (context, callback) {

                model.Group.findOneAndUpdate({'_id': context.groupId},{$pull:{'members' : context.profileId}},function(err,ret){
                    context.group = ret;
                    callback(err,context);
                });
            },

            // add group id to member's memberOf
            function (context, callback) {

                model.Profile.findOneAndUpdate({'_id': context.profileId},{$pull:{'memberOf' : context.groupId}},function(err,ret){
                    callback(err,context);
                });
            },


            // add the new member to all the conversations
            function (context, callback) {

                model.Conversation.find({"envelope.meta.groups": context.groupId}, function(err, conversations){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.conversationIds = [];
                        var functions = [];

                        for (var i=0; i < conversations.length; i++) {
                            context.conversationIds.push(conversations[i]._id.toHexString());

                            // remove from active members
                            for (var j=0; j < conversations[i].envelope.members.length; j++)
                                if (conversations[i].envelope.members[j] == context.profileId ) {
                                    conversations[i].envelope.members.slice(j,1);
                                    break;
                                }

                            // update conversation state
                            for (var j=0; j < conversations[i].state.members.length; j++)
                                if (conversations[i].state.members[j].member == context.profileId ) {
                                    conversations[i].state.members[j].state = "LEFT";
                                    --conversations[i].state.curMemberCount;
                                    break;
                                }

                            functions.push((function (doc) {
                                return function (callback) {
                                    doc.save(callback);
                                };

                            })(conversations[i]));
                        }

                        context.conversations = conversations;

                        if (context.conversations.length > 0) {

                            async.parallel(functions, function (err, results) {
                                callback(err,context);
                            });
                        }
                        else {
                            callback(null,context);
                        }
                    }
                });
            },

            // add the open group conversations to the new members inbox
            function (context, callback) {

                if (context.conversations.length > 0) {

                    model.Profile.findOneAndUpdate({'_id': context.profileId},{$pullAll:{'inbox' : context.conversationIds}},function(err,ret){
                        callback(err,context);
                    });
                }
                else {
                    callback(null,context);
                }
            }
        ],

        function (err, context) {
            console.log("leaveGroup(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.group);
            } else {
                res.json(400, err.message);
            }
        }
    );
};

