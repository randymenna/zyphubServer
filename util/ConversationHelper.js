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

       for (var i=0; i < conversation.stats.view.length; i++ ) {
           if ( conversation.stats.view[i].participant.id == (new ObjectId(profileId)).id ) {
               conversation.stats.view[i].state = state;
               break;
           }
       }
    };

    this.removeAllRecipientsNotInState = function( state, conversation ) {

        // update the stats
        for (var i=0; i < conversation.stats.view.length; i++ ) {

            if ( conversation.stats.view[i].state != state ) {
                conversation.stats.view[i].state = "REMOVED";
                conversation.envelope.recipients.pull(new ObjectId(conversation.stats.view[i].participant));
                --conversation.stats.currentParticipantCount;
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

        model.Person.update({'_id': { $in: context.conversation.envelope.recipients }},{$pull: {inbox: context.conversation._id}}, {multi:true}, function(err, profiles){
            if ( err ) {
                callback(err, null);
            }
            else {
                context.profiles = profiles;
                callback(null, context);
            }
        });
    };

    // remove participants from conversation
    this.removeAllRecipients = function(context,callback) {

        // update the stats
        for (var i=0; i < context.conversation.stats.view.length; i++ ) {

            context.conversation.stats.view[i].state = "REMOVED";
            context.conversation.envelope.recipients.pull(new ObjectId(context.conversation.stats.view[i].participant));
            --context.conversation.stats.currentParticipantCount;
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
            context.conversation.envelope.recipients.push( context.toProfiles[i] );
            context.conversation.stats.view.push( {participant: context.toProfiles[i], state: "UNOPENED"} );
            ++context.conversation.stats.currentParticipantCount;
        }
        callback(null, context);
    }
};

ConversationHelper.prototype.startConversation = function( event, callback ) {

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

                // remove from active recipients
                context.conversation.envelope.recipients.pull({_id: new ObjectId(context.profileId)});
                --context.conversation.stats.currentParticipantCount;
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
                if ( context.conversation.stats.maxAccepts == context.conversation.stats.accepts ) {
                    callback( new mongoose.Error("Max Accepts Reached"), null );
                }

                ++context.conversation.stats.accepts;
                self.updateState( context.profileId, "ACCEPTED", context.conversation);

                if ( context.conversation.stats.accepts == context.conversation.stats.maxAccepts ) {
                    self.removeAllRecipientsNotInState( "ACCEPTED", context.conversation );
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

                ++context.conversation.stats.rejects;
                self.updateState( context.profileId, "REJECTED", context.conversation );
                context.conversation.envelope.recipients.pull( context.profileId );
                --context.conversation.stats.currentParticipantCount;

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
                // remove from active recipients
                context.conversation.envelope.recipients.pull({_id: new ObjectId(context.profileId)});
                --context.conversation.stats.currentParticipantCount;
                ++context.conversation.stats.oks;
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
                self.removeAllRecipients(context, callback);
            },

            // remove profiles from Conversation
            function(context,callback) {
                // remove from active recipients
                self.updateState( context.profileId, "CLOSED", context.conversation);

                context.conversation.stats.currentParticipantCount = 0;

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

            // remove conversation from originator Inbox
            function(context, callback) {
                self.removeFromInbox(context, callback);
            },

            // remove originator from active recipients
            function(context,callback) {

                context.conversation.envelope.recipients.pull({_id: new ObjectId(context.profileId)});
                --context.conversation.stats.currentParticipantCount;
                self.updateState( context.profileId, "DELEGATED", context.conversation);

                callback(null, context);
            },

            // add conversation to new participants inbox
            function(context,callback) {
                self.addToInboxes(context, callback);
            },

            // add new participant to conversation
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
                if ( !context.escalate.isArray ) {
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
                self.removeAllRecipients(context, callback);
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