/**
 * Created by randy
 */

var async                   = require('async');
var config                  = require('config');
var model                   = require('../../../models/models');
var mongoose                = require('mongoose');
var ObjectId                = require('mongoose').Types.ObjectId;
var TagHelper               = require('./tagHelper');

var ConversationHelper = module.exports = function ConversationHelper () {

    this._conversationPublisher = null;

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
    this.removeConversationFromOriginMembersInbox = function(context, callback) {

        model.Profile.update({'_id': context.origin},{$pull: {inbox: context.conversation._id}}, function (err, doc) {
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

        model.Profile.update({'_id': { $in: context.conversation.envelope.members }},{$pull: {inbox: context.conversation._id}}, {multi:true}, function(err, profiles){
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
        model.Profile.update({'_id': { $in: context.toProfiles }},{$push: {inbox: context.conversation._id }}, {multi:true}, function(err, profiles){
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

    this.routeToGroups = function( context, callback ) {

        context.groups = [];

        var i = context.members.length;

        while (i--) {
            // is it a group?
            if (context.members[i].charAt(0) == 'b') {
                context.groups.push(context.members[i]);
                context.members.splice(i,1);
            }
        }

        if ( context.groups.length > 0 ) {
            model.Group.find({'_id': {$in: context.groups}}, function (err, groups) {

                if (err) {
                    callback(err, null);
                }
                else {
                    for (var i=0; i < groups.length; i++) {
                        context.members = context.members.concat(groups[i].members);
                    }

                    callback(null, context);
                }
            });
        }
        else {
            callback(null, context);
        }
    };

    this.routeToTags = function( context, callback ) {
        var self = this;

        model.Tag.find({'label': {$in: context.tags}}, function (err, tags) {

            if (err) {
                callback(err, null);
            }
            else {
                for (var i=0; i < tags.length; i++) {
                    if ( TagHelper.isActive(tags[i]) )
                        context.members.push(tags[i].owner[0]);
                }
                context.tags = tags;

                callback(null, context);
            }
        });
    };
};

ConversationHelper.prototype.setSchedulerPublisher = function( schedulerPublisher ) {
    var self = this;
    self._schedulerPublisher = schedulerPublisher;
}

ConversationHelper.prototype.requestToModel = function( body, user ) {
    var c = new model.Conversation();

    c.envelope.origin = user.origin;
    c.envelope.members = body.members;
    c.envelope.messageType = body.messageType;
    if ( body.tags )
        c.envelope.tags = body.tags;

    if ( body.ttl )
        c.time.toLive = body.ttl;
    c.content.message = body.content.text;
    // TODO: fix this
    c.escalation = body.escalation;

    return c;
}

ConversationHelper.prototype.decorateContext = function( context, body ) {

    context.originalMembers = JSON.parse(JSON.stringify(body.members));
    context.members = JSON.parse(JSON.stringify(context.originalMembers));

    context.messageType = body.messageType;
    context.ttl = body.ttl;
    context.tags = body.tags;
    context.escalation = body.escalation;

    return context;
}

ConversationHelper.prototype.route = function( context, callback ) {
    var self = this;

    self.routeToGroups(context, function (err, context) {
        if (err) {
            callback(err, null);
        }
        else {
            if (context.tags) {
                self.routeToTags(context, function (err, context) {
                    callback(err, context);
                });
            }
            else {
                callback(err, context);
            }
        }
    });
}

ConversationHelper.prototype.addProfileToConversations = function( profile, conversations, callback ) {
    var self = this;
    console.log("addProfileToConversation(): entered");

    async.waterfall(
        [
            function (callback) {
                var context = {};
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
            },

            // add the conversations to the profiles inbox
            function (context, callback) {

                if (context.conversations.length > 0) {

                    model.Profile.findOneAndUpdate({'_id': profile._id},{$pushAll:{'inbox' : context.conversationIds}},function(err,ret){
                        callback(err,context);
                    });
                }
                else {
                    callback(null,context);
                }
            }
        ],

        function (err, context) {
            console.log("addProfileToConversation(): exiting: err=%s,result=%s", err, context);
            callback( err, null );
        }
    );
};

ConversationHelper.prototype.removeProfileFromConversations = function( profile, conversations, callback ) {
    var self = this;
    console.log("removeProfileFromConversations(): entered");

    async.waterfall(
        [
            function (callback) {
                var context = {};
                context.conversationIds = conversations;
                context.profileId = profile;

                callback(null,context);
            },

            function(context,callback) {

                model.Conversation.find({'_id': { $in: context.conversationIds }})
                    .exec(function( err, conversations){
                        if ( err ) {
                            callback(err, null);
                        }
                        else {
                            context.conversations = conversations;
                            callback(null, context);
                        }
                    });
            },

            function(context,callback) {

                context.functions = [];

                for (var i=0; i < context.conversations.length; i++) {

                    // if conversation is closed, don't change it
                    if (!context.conversations[i].state.open)
                        continue;

                    // remove from active members
                    context.conversations[i].envelope.members.pull( {_id: new ObjectId(context.profileId)} );

                    // update conversation state
                    for (var j=0; j < context.conversations[i].state.members.length; j++)
                        if (context.conversations[i].state.members[j].member == context.profileId ) {
                            context.conversations[i].state.members[j].state = "LEFT";
                            --context.conversations[i].state.curMemberCount;
                            break;
                        }

                    context.functions.push((function (doc) {
                        return function (callback) {
                            doc.save(callback);
                        };

                    })(context.conversations[i]));
                }

                if (context.conversations.length > 0) {

                    async.parallel(context.functions, function (err, results) {
                        callback(err,context);
                    });
                }
                else {
                    callback(null,context);
                }
            },

            // remove conversations from the inbox
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
            console.log("removeProfileFromConversations(): exiting: err=%s,result=%s", err, context);
            callback( err, context );
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
                self.removeConversationFromOriginMembersInbox(context, callback);
            },

            // remove profile from Conversation
            function(context,callback) {

                // remove from active members
                context.conversation.envelope.members.pull({_id: new ObjectId(context.origin)});
                --context.conversation.state.curMemberCount;
                ++context.conversation.state.leaves;
                self.updateLastEvent( context.origin, "LEFT", context.conversation);

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
                self.updateLastEvent( context.origin, "ACCEPTED", context.conversation);

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
                self.updateLastEvent( context.origin, "REJECTED", context.conversation );
                context.conversation.envelope.members.pull( new ObjectId(context.origin) );
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
                self.removeConversationFromOriginMembersInbox(context, callback);
            },

            // remove profile from Conversation
            function(context,callback) {
                // remove from active members
                context.conversation.envelope.members.pull({_id: new ObjectId(context.origin)});
                --context.conversation.state.curMemberCount;
                ++context.conversation.state.oks;
                self.updateLastEvent( context.origin, "OK", context.conversation );

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
                self.updateLastEvent( context.origin, "CLOSED", context.conversation);

                context.conversation.state.open = false;

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
                self.removeConversationFromOriginMembersInbox(context, callback);
            },

            // remove origin from active members
            function(context,callback) {

                context.conversation.envelope.members.pull({_id: new ObjectId(context.origin)});
                --context.conversation.state.curMemberCount;
                self.updateLastEvent( context.origin, "DELEGATED", context.conversation);

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
                reply.origin = context.origin;
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

ConversationHelper.prototype.sanitize = function( conversation ) {

    function clean( c ) {

        delete c.__v;

        if (!c.escalation.id.length)
            delete c.escalation;

        delete c.envelope.meta;

        if ( !c.envelope.tags.length )
            delete c.envelope.tags;

        return c;
    }

    if ( conversation instanceof Array )
        for(var i=0; i < conversation.length; i++ ) {
            conversation[i] = clean( conversation[i].toObject());
        }
    else
        conversation = clean(conversation.toObject());

    return conversation;
}

ConversationHelper.prototype.getConversationsInInbox = function( inbox, callback ) {

    model.Conversation.find({'_id': { $in: inbox }})
        .populate('envelope.origin', 'label _id')
        .populate('envelope.members', 'label _id')
        .populate('state.members.member', 'label _id')
        .exec(function( err, conversations){
            if ( err ) {
                callback(err, null);
            }
            else {
                callback(null, conversations);
            }
        });
}