/**
 * Created by randy
 */

var async                   = require('async');
var config                  = require('config');
var model                   = require('../models/models');
var mongoose                = require('mongoose');
var ObjectId                = require('mongoose').Types.ObjectId;

var ConversationHelper = module.exports = function ConversationHelper () {

    this.removeFromArray = function( id, list ) {
        for (var i=0; i < list.length; i++) {
            if ( id == list._id ) {
                list.splice(i,1);
                break;
            }
        }
    };

    this.updateState = function( profileId, state , conversation) {

       for (var i=0; i < conversation.state.members.length; i++ ) {
           if ( conversation.state.members[i].member.id == (new ObjectId(profileId)).id ) {
               conversation.state.members[i].state = state;
               break;
           }
       }
    };

    this.removeAllMembersNotInState = function( state, conversation ) {

        // update the state
        for (var i=0; i < conversation.state.members.length; i++ ) {

            if ( conversation.state.members[i].state != state ) {
                conversation.state.members[i].state = "REMOVED";
                conversation.envelope.members.pull(new ObjectId(conversation.state.members[i].member));
                --conversation.state.curMemberCount;
            }
        }
    };

    // remove conversation from Inbox
    this.removeFromInbox = function(context, callback) {

        console.log(context.profileId);
        console.log(context.conversation._id);

        model.Person.update({'_id': context.profileId},{$pull: {inbox: context.conversation._id}}, function (err, doc) {
            if ( err ) {
                callback(err, null);
            }
            else {
                callback(null, context);
            }
        });
    };

    // remove conversation from Inbox
    this.removeFromAllInboxes = function(context,callback) {

        model.Person.update({'_id': { $in: context.conversation.envelope.members }},{$pull: {inbox: context.conversation._id}}, {multi:true}, function(err, profiles){
            if ( err ) {
                callback(err, null);
            }
            else {
                context.profiles = profiles;
                callback(null, context);
            }
        });
    };

    // remove members from conversation
    this.removeAllMembers = function(context,callback) {

        // update the state
        for (var i=0; i < context.conversation.state.members.length; i++ ) {

            context.conversation.state.members[i].state = "REMOVED";
            context.conversation.envelope.members.pull(new ObjectId(context.conversation.state.members[i].member));
            --context.conversation.state.curMemberCount;
        }
        callback(null,context)
    };

    this.addToInboxes = function( context, callback ) {
        model.Person.update({'_id': { $in: context.toProfiles }},{$push: {inbox: context.conversation._id }}, {multi:true}, function(err, profiles){
            if ( err ) {
                callback(err, null);
            }
            else {
                callback(null, context);
            }
        });
    }

    this.addToConversation = function( context, callback ) {
        for (var i=0; i < context.toProfiles.length; i++) {
            context.conversation.envelope.members.push( context.toProfiles[i] );
            context.conversation.state.members.push( {member: context.toProfiles[i], state: "UNOPENED"} );
            ++context.conversation.state.curMemberCount;
        }
        callback(null, context);
    }
};

ConversationHelper.prototype.startConversation = function( event, callback ) {
    var self = this;
    
    console.log("startConversation(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};
                var accountId = genericMongoController.extractAccountId(req);
                context.accountId = accountId;

                callback(null, context);
            },

            function (context, callback) {
                var c = new model.Conversation({
                    envelope:req.body.envelope,
                    time:req.body.time,
                    content:req.body.content
                });

                c.state.originalmemberCount = c.envelope.members.length;
                c.state.currentmemberCount = c.envelope.members.length;

                for (var i=0; i< c.envelope.members.length; i++) {
                    var tmp = {
                        member : mongoose.Types.ObjectId(c.envelope.members[i]),
                        state: "UNOPENED"
                    };

                    c.state.members.push(tmp);
                }

                context.conversation = c;

                context.conversation.save(function( err, conversation){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        callback(null, context);
                    }
                })
            },

            // add a conversation to all the members in-boxes
            function(context,callback) {
                model.Person.update({'_id': { $in: context.conversation.envelope.members }},{$push: {inbox: context.conversation._id}}, {multi:true}, function(err, profiles){

                    context.profiles = profiles;

                    callback(err,context);
                });
            },

            // find one conversation and fill in the name and id only of the members
            function(context,callback) {
                model.Conversation.findOne({_id: context.conversation._id})
                    .populate('envelope.originator', 'label _id')
                    .populate('envelope.members', 'label _id')
                    .populate('state.members.member', 'label')
                    .exec(function( err, conversation){
                        if ( err ) {
                            callback(err, null);
                        }
                        else {
                            context.conversation = conversation;
                            callback(null, context);
                        }
                    });
            }
        ],

        function (err, context) {
            console.log("newConversation(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.conversation);
            } else {
                res.json(400, err.message);
            }
        }
    );
};

ConversationHelper.prototype.leaveConversation = function( context, callback ) {
    var self = this;

    console.log("leaveConversation(): entered");
    async.waterfall(
        [
            function (callback) {

                callback(null, context);
            },

            // remove conversation from Inbox
            function(context, callback) {
                self.removeFromInbox(context, callback);
            },

            // remove profile from Conversation
            function(context,callback) {

                // remove from active members
                context.conversation.envelope.members.pull({_id: new ObjectId(context.profileId)});
                --context.conversation.state.curMemberCount;
                ++context.conversation.state.leaves;
                self.updateState( context.profileId, "LEFT", context.conversation);

                context.conversation.save(function( err, conversation ){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {

                        context.conversation = conversation;

                        callback(null, context);
                    }
                });
            }
        ],

        function (err, context) {
            console.log("leaveConversation(): exit: error %s", err);
            callback( err, context.conversation );
        }
    );
};

ConversationHelper.prototype.acceptConversation = function( context, callback ) {
    var self = this;

    console.log("acceptConversation(): entered");
    async.waterfall(
        [
            function (callback) {

                callback(null, context);
            },

            // update Conversation
            function(context,callback) {

                // bump accepts
                if ( context.conversation.state.maxAccepts == context.conversation.state.accepts ) {
                    callback( new mongoose.Error("Max Accepts Reached"), null );
                }

                ++context.conversation.state.accepts;
                self.updateState( context.profileId, "ACCEPTED", context.conversation);

                if ( context.conversation.state.accepts == context.conversation.state.maxAccepts ) {
                    self.removeAllMembersNotInState( "ACCEPTED", context.conversation );
                }

                context.conversation.save(function( err, conversation ){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {

                        context.conversation = conversation;

                        callback(null, context);
                    }
                });
            }
        ],

        function (err, context) {
            console.log("acceptConversation(): exit: error %s", err);
            callback( err, context.conversation );
        }
    );
};

ConversationHelper.prototype.rejectConversation = function( context, callback ) {
    var self = this;

    console.log("rejectConversation(): entered");
    async.waterfall(
        [
            function (callback) {

                callback(null, context);
            },

            // update Conversation
            function(context,callback) {

                ++context.conversation.state.rejects;
                self.updateState( context.profileId, "REJECTED", context.conversation );
                context.conversation.envelope.members.pull( new ObjectId(context.profileId) );
                --context.conversation.state.curMemberCount;

                context.conversation.save(function( err, conversation ){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {

                        context.conversation = conversation;

                        callback(null, context);
                    }
                });
            }
        ],

        function (err, context) {
            console.log("rejectConversation(): exit: error %s", err);
            callback( err, context );
        }
    );
};

ConversationHelper.prototype.okConversation = function( context, callback ) {
    var self = this;

    console.log("okConversation(): entered");
    async.waterfall(
        [
            function (callback) {

                callback(null, context);
            },

            function(context,callback) {
                self.removeFromInbox(context, callback);
            },

            // remove profile from Conversation
            function(context,callback) {
                // remove from active members
                context.conversation.envelope.members.pull({_id: new ObjectId(context.profileId)});
                --context.conversation.state.curMemberCount;
                ++context.conversation.state.oks;
                self.updateState( context.profileId, "OK", context.conversation );

                context.conversation.save(function( err, conversation ){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {

                        context.conversation = conversation;

                        callback(null, context);
                    }
                });
            }
        ],

        function (err, context) {
            console.log("okConversation(): exit: error %s", err);
            callback( err, context );
        }
    );
};

ConversationHelper.prototype.closeConversation = function( context, callback ) {
    var self = this;

    console.log("closeConversation(): entered");
    async.waterfall(
        [
            function (callback) {

                callback(null, context);
            },

            function(context,callback) {
                self.removeFromAllInboxes(context, callback);
            },

            function(context,callback) {
                self.removeAllMembers(context, callback);
            },

            // remove profiles from Conversation
            function(context,callback) {
                // remove from active members
                self.updateState( context.profileId, "CLOSED", context.conversation);

                context.conversation.state.curMemberCount = 0;

                context.conversation.save(function( err, conversation ){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {

                        context.conversation = conversation;
                        callback(null, context);
                    }
                });
            }
        ],

        function (err, context) {
            console.log("closeConversation(): exit: error %s", err);
            callback( err, context );
        }
    );
};



ConversationHelper.prototype.forwardConversation = function( context, callback ) {
    var self = this;

    console.log("forwardConversation(): entered");
    async.waterfall(
        [
            function (callback) {

                if ( !context.forward.isArray ) {
                    context.toProfiles = [];
                    context.toProfiles.push(context.forward);
                }
                else {
                    context.toProfiles = context.forward;
                }
                callback(null, context);
            },

            function(context,callback) {
                self.addToInboxes(context, callback);
            },

            function(context,callback) {
                self.addToConversation(context, callback);
            },

            // save Conversation
            function(context,callback) {

                ++context.conversation.state.forwards;
                
                context.conversation.save(function (err, doc) {
                        if ( err ) {
                            callback(err, null);
                        }
                        else {
                            context.conversation  = doc;
                            callback(null, context);
                        }
                    });
            }
        ],

        function (err, context) {
            console.log("forwardConversation(): exit: error %s", err);
            callback( err, context );
        }
    );
};

ConversationHelper.prototype.delegateConversation = function( context, callback ) {
    var self = this;

    console.log("delegateConversation(): entered");
    async.waterfall(
        [
            function (callback) {
                context.toProfiles = [];
                context.toProfiles.push(context.delegate);

                callback(null, context);
            },

            // remove conversation from origin Inbox
            function(context, callback) {
                self.removeFromInbox(context, callback);
            },

            // remove origin from active members
            function(context,callback) {

                context.conversation.envelope.members.pull({_id: new ObjectId(context.profileId)});
                --context.conversation.state.curMemberCount;
                self.updateState( context.profileId, "DELEGATED", context.conversation);

                callback(null, context);
            },

            // add conversation to new members inbox
            function(context,callback) {
                self.addToInboxes(context, callback);
            },

            // add new member to conversation
            function(context,callback) {
                self.addToConversation(context, callback);
            },

            // save Conversation
            function(context,callback) {
                
                ++context.conversation.state.delegates;
                
                context.conversation.save(function (err, doc) {
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.conversation  = doc;
                        callback(null, context);
                    }
                });
            }
        ],

        function (err, context) {
            console.log("delegateConversation(): exit: error %s", err);
            callback( err, context );
        }
    );
};

ConversationHelper.prototype.escalateConversation = function( context, callback ) {
    var self = this;

    console.log("escalateConversation(): entered");
    async.waterfall(
        [
            function (callback) {
                if ( !context.escalate.length ) {
                    context.toProfiles = [];
                    context.toProfiles.push(context.escalate);
                }
                else {
                    context.toProfiles = context.escalate;
                }
                callback(null, context);
            },

            function(context,callback) {
                self.removeFromAllInboxes(context, callback);
            },

            function(context,callback) {
                self.removeAllMembers(context, callback);
            },

            function(context,callback) {
                self.addToInboxes(context, callback);
            },

            function(context,callback) {
                self.addToConversation(context, callback);
            },

            // save Conversation
            function(context,callback) {

                context.conversation.save(function (err, doc) {
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.conversation  = doc;
                        callback(null, context);
                    }
                });
            }
        ],

        function (err, context) {
            console.log("escalateConversation(): exit: error %s", err);
            callback( err, context );
        }
    );
};