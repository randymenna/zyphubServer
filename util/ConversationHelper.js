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

    this.updateLastEvent = function( profileId, state , conversation) {

       for (var i=0; i < conversation.state.members.length; i++ ) {
           if ( conversation.state.members[i].member.id == (new ObjectId(profileId)).id ) {
               conversation.state.members[i].lastEvent = state;
               break;
           }
       }
    };

    this.removeAllMembersWhoDontHaveLastEventFromConversation = function( state, conversation ) {

        // update the state
        for (var i=0; i < conversation.state.members.length; i++ ) {

            if ( conversation.state.members[i].lastEvent != state ) {
                conversation.state.members[i].lastEvent = "REMOVED";
                conversation.envelope.members.pull(new ObjectId(conversation.state.members[i].member));
                --conversation.state.curMemberCount;
            }
        }
    };

    // remove conversation from Inbox
    this.removeConversationFromOneMembersInbox = function(context, callback) {

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
    this.removeConversationFromAllMembersInboxes = function(context,callback) {

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
    this.removeAllMembersFromConversation = function(context,callback) {

        // update the state
        for (var i=0; i < context.conversation.state.members.length; i++ ) {

            context.conversation.state.members[i].state = "REMOVED";
            context.conversation.envelope.members.pull(new ObjectId(context.conversation.state.members[i].member));
            --context.conversation.state.curMemberCount;
        }
        callback(null,context)
    };

    this.addConversationToNewMembersInboxes = function( context, callback ) {
        model.Person.update({'_id': { $in: context.toProfiles }},{$push: {inbox: context.conversation._id }}, {multi:true}, function(err, profiles){
            if ( err ) {
                callback(err, null);
            }
            else {
                callback(null, context);
            }
        });
    }

    this.addNewMembersToConversation = function( context, callback ) {
        for (var i=0; i < context.toProfiles.length; i++) {
            context.conversation.envelope.members.push( context.toProfiles[i] );
            context.conversation.state.members.push( {member: context.toProfiles[i], state: "UNOPENED"} );
            ++context.conversation.state.curMemberCount;
        }
        callback(null, context);
    }

    this.escalationConditionMet = function( context ) {
        var condition = context.escalation.steps[context.currentStep].trigger;
        var doNextStep = true;

        switch( condition ) {
            case "NO_READS":
                for (var i=0; i < context.conversation.state.members.length; i++) {
                    if (context.conversation.state.members[i].lastEvent != 'UNREAD') {
                        doNextStep = false;
                        break;
                    }
                }
                break;

            case "NO_REPLIES":
                if (context.conversation.envelope.replies.length)
                    doNextStep = false;
                break;
        }

        return doNextStep;
    }
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
                self.removeConversationFromOneMembersInbox(context, callback);
            },

            // remove profile from Conversation
            function(context,callback) {

                // remove from active members
                context.conversation.envelope.members.pull({_id: new ObjectId(context.profileId)});
                --context.conversation.state.curMemberCount;
                ++context.conversation.state.leaves;
                self.updateLastEvent( context.profileId, "LEFT", context.conversation);

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
                self.updateLastEvent( context.profileId, "ACCEPTED", context.conversation);

                if ( context.conversation.state.accepts == context.conversation.state.maxAccepts ) {
                    self.removeAllMembersWhoDontHaveLastEventFromConversation( "ACCEPTED", context.conversation );
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
                self.updateLastEvent( context.profileId, "REJECTED", context.conversation );
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
                self.removeConversationFromOneMembersInbox(context, callback);
            },

            // remove profile from Conversation
            function(context,callback) {
                // remove from active members
                context.conversation.envelope.members.pull({_id: new ObjectId(context.profileId)});
                --context.conversation.state.curMemberCount;
                ++context.conversation.state.oks;
                self.updateLastEvent( context.profileId, "OK", context.conversation );

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
                self.removeConversationFromAllMembersInboxes(context, callback);
            },

            function(context,callback) {
                self.removeAllMembersFromConversation(context, callback);
            },

            // remove profiles from Conversation
            function(context,callback) {
                // remove from active members
                self.updateLastEvent( context.profileId, "CLOSED", context.conversation);

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
                    context.newMembers = [];
                    context.newMembers.push(context.forward);
                }
                else {
                    context.newMembers = context.forward;
                }
                callback(null, context);
            },

            function(context,callback) {
                self.addConversationToNewMembersInboxes(context, callback);
            },

            function(context,callback) {
                self.addNewMembersToConversation(context, callback);
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
                context.newMembers = [];
                context.newMembers.push(context.delegate);

                callback(null, context);
            },

            // remove conversation from origin Inbox
            function(context, callback) {
                self.removeConversationFromOneMembersInbox(context, callback);
            },

            // remove origin from active members
            function(context,callback) {

                context.conversation.envelope.members.pull({_id: new ObjectId(context.profileId)});
                --context.conversation.state.curMemberCount;
                self.updateLastEvent( context.profileId, "DELEGATED", context.conversation);

                callback(null, context);
            },

            // add conversation to new members inbox
            function(context,callback) {
                self.addConversationToNewMembersInboxes(context, callback);
            },

            // add new member to conversation
            function(context,callback) {
                self.addNewMembersToConversation(context, callback);
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

                if ( self.escalationTriggerMet(context) ) {

                    context.newMembers = context.escalate.steps[context.currentState].targets;

                    callback( context, null );
                }
                else {
                    callback( Error("Escalation Aborted"), null );
                }
            },

            function(context,callback) {
                self.removeConversationFromAllMembersInboxes(context, callback);
            },

            function(context,callback) {
                self.removeAllMembersFromConversation(context, callback);
            },

            function(context,callback) {
                self.addConversationToNewMembersInboxes(context, callback);
            },

            function(context,callback) {
                self.addNewMembersToConversation(context, callback);
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
            },

            function(context, callback) {

                ++context.currentStep;

                if ( context.currentStep < context.conversation.escalation.steps.length ) {

                    context.action = "escalationStep";

                    _schedulerPublisher.publish('SchedulerQueue', context, function (error) {
                        if (error)
                            callback(Error("Scheduler Publish Failed: setEscalation"), null);
                        else
                            callback(null, context);
                    });
                }
                else {
                    // TODO : do something to indicate that escalation is exhausted
                    callback(null, context);
                }
            }
        ],

        function (err, context) {
            console.log("escalateConversation(): exit: error %s", err);
            callback( err, context );
        }
    );
};

ConversationHelper.prototype.replyToConversation = function( context, callback ) {
    var self = this;

    console.log("replyToConversation(): entered");
    async.waterfall(
        [
            function (callback) {
                callback(null, context);
            },

            // save Conversation
            function(context,callback) {

                var reply = {};
                reply.origin = context.profileId;
                reply.content = context.reply;

                context.conversation.content.replies.push(reply);

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
            console.log("replyToConversation(): exit: error %s", err);
            callback( err, context );
        }
    );
};