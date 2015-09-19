/**
 * Created by randy on 9/4/14.
 */

var async                   = require('async');
var mongoose                = require('mongoose');
var model                   = require('../../models/models');
var groupHelper             = require('./helper/groupHelper');

var ObjectId = mongoose.Types.ObjectId;

exports.getGroups = function (req, res) {

    console.log('getGroups(): entered');
    async.waterfall(
        [
            function (callback) {
                var context = {};
                context.origin = req.user.origin;

                callback(null, context);
            },
            function (context, callback) {
                model.Group.find().exec(function( err, groups){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.groups = [];

                        for (var i=0; i < groups.length; i++ )
                            context.groups[i] = groupHelper.santize( groups[i].toObject() );

                        callback(null, context);
                    }
                })
            }
        ],

        function (err, context) {
            console.log('getGroups(): exiting: err=%s,result=%s', err, context);
            if (!err) {
                res.status(200).json(context.groups);
            } else {
                res.status(400).json(err);
            }
        }
    );
};

exports.getOneGroup = function (req, res) {

    console.log('getOneGroup(): entered');
    async.waterfall(
        [
            function (callback) {
                var context = {};
                context.origin = req.user.origin;
                context._id = req.params.id;

                callback(null, context);
            },
            function (context, callback) {
                model.Group.findOne({_id: context._id})
                    //.populate('owner', 'label id')
                    //.populate('members', 'label id')
                    .exec(function( err, group){
                        if ( err ) {
                            if (err.name == 'CastError') {
                                err.message = 'missing or malformed profiled id';
                                err.name = 'BadParameter';
                            }
                            callback(err, null);
                        }
                        else {
                            context.group = groupHelper.santize( group.toObject() );
                            callback(null, context);
                        }
                    });
            }
        ],

        function (err, context) {
            console.log('getOneGroup(): exiting: err=%s,result=%s', err, context);
            if (!err) {
                res.status(200).json(context.group);
            } else {
                res.status(400).json(err);
            }
        }
    );
};

exports.newGroup = function (req, res) {

    console.log('newGroup(): entered');
    async.waterfall(
        [
            function (callback) {
                var context = {};
                context.origin = req.user.origin;

                context.name = req.body.name;
                context.label = req.body.label;
                context.members = [req.user.origin];
                context.owner = [req.user.origin];

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
                        context.group = groupHelper.santize( group.toObject() );
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
            console.log('newGroup(): exiting: err=%s,result=%s', err, context);
            if (!err) {
                res.status(200).json(context.group);
            } else {
                res.status(400).json(err.message);
            }
        }
    );
};

exports.update = function (req, res) {

    console.log('groups.update(): entered');
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.search = {};
                context.search._id = ObjectId(req.params.id);

                context.update = {};
                if (req.body.label)
                    context.update.label = req.body.label;
                if (req.body.members)
                    context.update.members = req.body.members;
                if (req.body.enterprise)
                    context.update.enterprise = req.body.enterprise;
                if (req.body.owner)
                    context.update.owner = req.body.owner;

                callback(null, context);
            },
            function (context, callback) {
                model.Group.findOneAndUpdate(context.search,context.update).exec(function( err, group){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.group = groupHelper.santize( group.toObject() );
                        callback(null, context);
                    }
                })
            }
        ],

        function (err, context) {
            console.log('groups.update(): exiting: err=%s,result=%s', err, context);
            if (!err) {
                res.status(200).json(context.group);
            } else {
                res.status(400).json(err);
            }
        }
    );
};

exports.remove = function (req, res) {

    console.log('groups.remove(): entered');
    async.waterfall(
        [
            function (callback) {
                var context = {};
                var err = false;

                context.search = {};
                try {
                    context.search._id = ObjectId(req.params.id);
                } catch( e ) {
                    err = { message: 'missing or malformed group id' };
                }
                if ( err )
                    callback(err, null);
                else
                    callback(null, context);
            },
            function (context, callback) {
                model.Group.findOneAndRemove(context.search).exec(function( err, group){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        if ( group )
                            context.group = groupHelper.santize( group.toObject() );
                        callback(null, context);
                    }
                })
            }
        ],

        function (err, context) {
            console.log('groups.remove(): exiting: err=%s,result=%s', err, context);
            if (!err) {
                res.status(200).json(context.group);
            } else {
                res.status(400).json(err);
            }
        }
    );
};

exports.joinGroup = function (req, res) {

    console.log('joinGroup(): entered');
    async.waterfall(
        [
            function (callback) {
                var context = {};
                context.origin = req.user.origin;

                context.groupId = req.params.id;
                context.profileIds = req.body.members;

                console.log('joinGroup(): group=%s profile=%', context.groupId, context.profileIds);
                callback(null, context);
            },

            // add member id to group members
            function (context, callback) {

                model.Group.findOneAndUpdate({'_id': context.groupId},{$push:{'members' : { $each: context.profileIds}}},function(err,ret){
                    context.group = ret;
                    callback(err,context);
                });
            },

            // add the new member to all the groups conversations
            function (context, callback) {

                model.Conversation.find({'envelope.meta.groups': context.groupId}, function(err, conversations){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.conversationIds = [];
                        var functions = [];

                        for (var i=0; i < conversations.length; i++) {
                            context.conversationIds.push(conversations[i]._id.toHexString());

                            for (var j=0; j < context.profileIds.length; j++) {
                                conversations[i].envelope.members.push( context.profileIds[j] );
                                conversations[i].state.members.push( {member: context.profileIds[j], state: 'UNOPENED'} );
                                ++conversations[i].state.curMemberCount;
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

            // add group id to member's memberOf
            // add the open group conversations to the new members inbox
            function (context, callback) {

                model.Profile.find({'_id': { $in: context.profileIds}},function(err,members){
                    context.members = members;
                    var functions = [];

                    for (var i=0; i < members.length; i++) {
                        context.members[i].memberOf.push(context.groupId);
                        if (context.conversations.length > 0) {
                            context.members[i].inbox = context.members[i].inbox.concat(context.conversationIds);
                        }

                        functions.push((function (doc) {
                            return function (callback) {
                                doc.save(callback);
                            };
                        })(context.members[i]));
                    }

                    if (context.members.length > 0) {

                        async.parallel(functions, function (err, results) {
                            callback(err,context);
                        });
                    }
                    else {
                        callback(null,context);
                    }
                });
            }
        ],

        function (err, context) {
            console.log('joinGroup(): exiting: err=%s,result=%s', err, context);
            if (!err) {
                res.status(200).json(groupHelper.santize(context.group.toObject()));
            } else {
                res.status(400).json(err.message);
            }
        }
    );
};

exports.leaveGroup = function (req, res) {

    console.log('leaveGroup(): entered');
    async.waterfall(
        [
            function (callback) {
                var context = {};
                context.origin = req.user.origin;

                context.groupId = req.params.id;
                context.profileIds = req.body.members;

                console.log('leaveGroup(): group=%s profile=%', context.groupId, context.profileIds);
                callback(null, context);
            },

            // remove member ids from group members array
            function (context, callback) {

                model.Group.findOneAndUpdate({'_id': context.groupId},{$pullAll:{ 'members': context.profileIds}},function(err,group){
                    if ( group ) {
                        context.group = groupHelper.santize(group.toObject());
                        callback(err, context);
                    }
                    else {
                        var error = err ? err : { message: 'missing or malformed group id'};
                        callback(error,null);
                    }
                });
            },

            // remove member from all the groups conversations
            function (context, callback) {

                model.Conversation.find({'envelope.meta.groups': context.groupId}, function(err, conversations){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.conversationIds = [];
                        var functions = [];

                        for (var i=0; i < conversations.length; i++) {
                            context.conversationIds.push(conversations[i]._id.toHexString());

                            for (var j=0; j < context.profileIds.length; j++) {
                                // remove from active members
                                for (var j = 0; j < conversations[i].envelope.members.length; j++)
                                    if (conversations[i].envelope.members[j] == context.profileIds[j]) {
                                        conversations[i].envelope.members.slice(j, 1);
                                        break;
                                    }

                                // update conversation state
                                for (var j = 0; j < conversations[i].state.members.length; j++)
                                    if (conversations[i].state.members[j].member == context.profileIds[j]) {
                                        conversations[i].state.members[j].state = 'LEFT';
                                        --conversations[i].state.curMemberCount;
                                        break;
                                    }
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

            // remove conversations from the members inbox
            // remove group id from member's memberOf array
            function (context, callback) {

                model.Profile.find({'_id': { $in: context.profileIds}},function(err,members){
                    context.members = members;
                    var functions = [];

                    for (var i=0; i < members.length; i++) {
                        context.members[i].memberOf = groupHelper.pull(context.members[i].memberOf, context.groupId);

                        if (context.conversations.length > 0) {
                            context.members[i].inbox = groupHelper.pullAll(context.members[i].inbox, context.conversationIds);
                        }

                        functions.push((function (doc) {
                            return function (callback) {
                                doc.save(callback);
                            };
                        })(context.members[i]));
                    }

                    if (context.members.length > 0) {

                        async.parallel(functions, function (err, results) {
                            callback(err,context);
                        });
                    }
                    else {
                        callback(null,context);
                    }
                });
            }
        ],

        function (err, context) {
            console.log('leaveGroup(): exiting: err=%s,result=%s', err, context);
            if (!err) {
                res.status(200).json(groupHelper.santize(context.group));
            } else {
                res.status(400).json(err.message);
            }
        }
    );
};

