/**
 * Created by randy
 */

var async                   = require('async');
var model                   = require('../../../models/models');
var mongoose                = require('mongoose');
var ObjectId                = require('mongoose').Types.ObjectId;
var TagHelper               = require('./tagHelper');
var NotificationHelper      = require('../../../util/notificationHelper');
var paperwork               = require('paperwork');

var ConversationHelper = module.exports = function ConversationHelper () {

    this._notificationHelper = new NotificationHelper();
    this._notificationHelper.setConversationHelper(this);

    this._conversationPublisher = null;

    this.removeFromArray = function( id, list ) {
        for (var i=0; i < list.length; i++) {
            if ( id === list._id ) {
                list.splice(i,1);
                break;
            }
        }
    };

    this.getCurrentState = function( profileId, conversation ) {
        var state = 'error';
        for (var i=0; i < conversation.state.members.length; i++ ) {
            if ( conversation.state.members[i].member.toHexString() === profileId ) {
                state = conversation.state.members[i].lastEvent;
                break;
            }
        }
        return state;
    };

    this.updateLastEvent = function( profileId, state , conversation) {

       for (var i=0; i < conversation.state.members.length; i++ ) {
           if ( conversation.state.members[i].member.id === (new ObjectId(profileId)).id ) {
               conversation.state.members[i].lastEvent = state;
               break;
           }
       }
    };

    this.removeAllMembersWhoDontHaveLastEventFromConversationExceptingOwner = function( state, conversation ) {

        // update the state
        var owner = new ObjectId(conversation.envelope.origin.id).toHexString();
        for (var i=0; i < conversation.state.members.length; i++ ) {

            if ( conversation.state.members[i].member.toHexString() !== owner && conversation.state.members[i].lastEvent !== state ) {
                conversation.state.members[i].lastEvent = 'REMOVED';
                conversation.envelope.members.pull(new ObjectId(conversation.state.members[i].member));
                --conversation.state.curMemberCount;
            }
        }
    };

    // remove conversation from Inbox
    this.removeConversationFromOriginMembersInbox = function(context, callback) {

        model.Profile.update({'_id': context.origin},{$pull: {inbox: context.conversation._id}}, function (err) {
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
        context.conversation.envelope.meta.originalMembers = context.conversation.envelope.members.slice(0);
        for (var i=0; i < context.conversation.state.members.length; i++ ) {

            context.conversation.state.members[i].state = 'REMOVED';
            context.conversation.envelope.members.pull(new ObjectId(context.conversation.state.members[i].member));
            --context.conversation.state.curMemberCount;
        }
        callback(null,context);
    };

    this.addConversationToNewMembersInboxes = function( context, callback ) {
        model.Profile.update({'_id': { $in: context.toProfiles }},{$push: {inbox: context.conversation._id }}, {multi:true}, function(err){
            if ( err ) {
                callback(err, null);
            }
            else {
                callback(null, context);
            }
        });
    };

    this.addNewMembersToConversation = function( context, callback ) {
        for (var i=0; i < context.toProfiles.length; i++) {
            context.conversation.envelope.members.push( context.toProfiles[i] );
            context.conversation.state.members.push( {member: context.toProfiles[i], state: 'UNOPENED'} );
            ++context.conversation.state.curMemberCount;
        }
        callback(null, context);
    };

    this.escalationConditionMet = function( context ) {
        var condition = context.escalation.steps[context.currentStep].trigger;
        var doNextStep = true;

        switch( condition ) {
            case 'NO_READS':
                for (var i=0; i < context.conversation.state.members.length; i++) {
                    if (context.conversation.state.members[i].lastEvent !== 'UNREAD') {
                        doNextStep = false;
                        break;
                    }
                }
                break;

            case 'NO_REPLIES':
                if (context.conversation.envelope.replies.length) {
                    doNextStep = false;
                }
                break;
        }

        return doNextStep;
    };

    this.routeToGroups = function( context, callback ) {

        context.groups = [];

        var i = context.members.length;

        while (i--) {
            // is it a group?
            if (context.members[i].charAt(0) === 'b') {
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

        model.Tag.find({'label': {$in: context.tags}}, function (err, tags) {

            if (err) {
                callback(err, null);
            }
            else {
                for (var i=0; i < tags.length; i++) {
                    if ( TagHelper.isActive(tags[i]) ) {
                        context.members.push(tags[i].owner[0]);
                    }
                }
                context.tags = tags;

                callback(null, context);
            }
        });
    };
};

ConversationHelper.prototype.isAccepted = function(c) {
    var accepted = false;
    for(var i=0; i < c.state.members.length; i++){
        if (c.state.members[i].lastEvent === 'ACCEPTED'){
            accepted = true;
            break;
        }
    }
    return accepted;
};

ConversationHelper.prototype.getOriginAllowableActions = function( c ){
    var self = this;

    var actions = {
        'STANDARD' : [ 'CLOSE', 'REPLY', 'FORWARD' ],
        'FYI' : [ 'CLOSE', 'FORWARD' ],
        'FCFS': [ 'CLOSE', 'FORWARD', 'REPLY'],
        'FCFS_ACCEPTED': ['REPLY','CLOSE']
    };

    var pattern = null;

    switch (c.envelope.pattern) {
        case 'STANDARD':
        case 'FYI':
            pattern = c.envelope.pattern;
            break;

        case 'FCFS':
            pattern = self.isAccepted(c) ? 'FCFS_ACCEPTED' : 'FCFS';
            break;
    }

    return actions[pattern];
};

ConversationHelper.prototype.getParticipantAllowableActions = function( c ){
    var self = this;

    var actions = {
        'STANDARD' : [ 'READ', 'LEAVE', 'REPLY', 'FORWARD', 'DELEGATE' ],
        'FYI' : [ 'READ', 'OK' ],
        'FCFS': [ 'READ', 'ACCEPT', 'REJECT', 'REPLY'],
        'FCFS_ACCEPTED': ['REPLY']
    };

    var pattern = null;

    switch (c.envelope.pattern) {
        case 'STANDARD':
        case 'FYI':
            pattern = c.envelope.pattern;
            break;

        case 'FCFS':
            pattern = self.isAccepted(c) ? 'FCFS_ACCEPTED' : 'FCFS';
            break;
    }

    return actions[pattern];
};

ConversationHelper.prototype.setSchedulerPublisher = function( schedulerPublisher ) {
    var self = this;
    self._schedulerPublisher = schedulerPublisher;
};

ConversationHelper.prototype.requestToNewModel = function( body, user, callback ) {

    var apiTemplate = {
        members: [String],
        pattern: String,
        priority: paperwork.optional(String, function(p){
            var  i = parseInt(p);
            return i > -1 && i < 3;
        }),
        content: {text:String},
        ttl: paperwork.optional(String),
        tags: paperwork.optional([String]),
        escalation: paperwork.optional(String)
    };


    // TODO: for now we validate the parameters here, but this needs to be moved to express
    paperwork(apiTemplate, body, function (err, validated) {
        if (err) {
            // err is the list of incorrect fields
            console.error(err);
            callback(err, null);
        } else {
            // api parameters were validated
            var context = {};

            // build the context, will be shared by all subsequent processes
            //
            context.origin                      = user.origin;
            context.enterprise                  = user.enterprise;
            context.enterpriseId                = user.enterpriseId;
            context.members                     = JSON.parse(JSON.stringify(validated.members));
            context.members.push(user.origin);

            // create a new model and initialize it
            var c = new model.Conversation();

            c.envelope.origin                   = user.origin;
            c.envelope.enterprise               = user.enterpriseId;
            c.envelope.members                  = JSON.parse(JSON.stringify(context.members));
            c.envelope.latestMember             = user.origin;
            c.envelope.pattern                  = validated.pattern;
            c.envelope.priority                 = validated.priority;

            if (!c.envelope.meta){
                c.envelope.meta = {};
            }
            c.envelope.meta.enterprise          = user.enterprise;
            c.envelope.meta.originalMembers     = JSON.parse(JSON.stringify(validated.members));

            c.state.startMemberCount           = validated.members.length;

            if ( context.tags ) {
                c.envelope.tags                 = validated.tags;
            }

            if ( context.ttl ) {
                c.time.toLive                   = validated.ttl;
            }
            c.content.message                   = validated.content.text;
            // TODO: this is not correct, escaltion is more complex
            c.escalation                        = validated.escalation;

            context.conversation =  c;

            callback(null, context);
        }
    });
};

ConversationHelper.prototype.validateUpdateParams = function( action, body, callback ) {

    var apiTemplate = {
        reply: paperwork.optional({
            content: String
        }),
        forward: paperwork.optional([String]),
        delegate: paperwork.optional([String])
    };

    // TODO: for now we validate the parameters here, but this needs to be moved to express
    paperwork(apiTemplate, body, function (err, validated) {
        if (err) {
            // err is the list of incorrect fields
            console.error(err);
            callback(err, null);
        } else {
            action = action.toUpperCase();

            // api parameters were validated
            var error = 'Required parameter is missing';
            if (action === 'REPLY' && !body.reply) {
                callback(error, null);
            }
            else
            if (action === 'FORWARD' && !body.forward) {
                callback(error, null);
            }
            else
            if (action === 'DELEGATE' && !body.delegate) {
                callback(error, null);
            } else {
                var context = {
                    action: action,
                    body: body
                };
                callback(null, context);
            }
        }
    });
};

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
};

ConversationHelper.prototype.addProfileToConversations = function( profile, conversations, callback ) {
    console.log('addProfileToConversation(): entered');

    async.waterfall(
        [
            function (callback) {
                var context = {};
                context.conversationIds = [];
                var functions = [];

                for (var i=0; i < conversations.length; i++) {
                    context.conversationIds.push(conversations[i]._id.toHexString());
                    conversations[i].envelope.members.push( context.profileId );
                    conversations[i].state.members.push( {member: context.profileId, state: 'UNOPENED'} );
                    ++conversations[i].state.curMemberCount;

                    functions.push((function (doc) {
                        return function (callback) {
                            doc.save(callback);
                        };
                    })(conversations[i]));
                }

                context.conversations = conversations;

                if (context.conversations.length > 0) {

                    async.parallel(functions, function (err) {
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

                    model.Profile.findOneAndUpdate({'_id': profile._id},{$pushAll:{'inbox' : context.conversationIds}},{'new': true},function(err){
                        callback(err,context);
                    });
                }
                else {
                    callback(null,context);
                }
            }
        ],

        function (err, context) {
            console.log('addProfileToConversation(): exiting: err=%s,result=%s', err, context);
            callback( err, null );
        }
    );
};

ConversationHelper.prototype.removeProfileFromConversations = function( profile, conversations, callback ) {
    console.log('removeProfileFromConversations(): entered');

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
                    if (!context.conversations[i].state.open) {
                        continue;
                    }

                    // remove from active members
                    context.conversations[i].envelope.members.pull( {_id: new ObjectId(context.profileId)} );

                    // update conversation state
                    for (var j=0; j < context.conversations[i].state.members.length; j++) {
                        if (context.conversations[i].state.members[j].member === context.profileId) {
                            context.conversations[i].state.members[j].state = 'LEFT';
                            --context.conversations[i].state.curMemberCount;
                            break;
                        }
                    }

                    context.functions.push((function (doc) {
                        return function (callback) {
                            doc.save(callback);
                        };

                    })(context.conversations[i]));
                }

                if (context.conversations.length > 0) {

                    async.parallel(context.functions, function (err) {
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

                    model.Profile.findOneAndUpdate({'_id': context.profileId},{$pullAll:{'inbox' : context.conversationIds}},{'new': true},function(err){
                        callback(err,context);
                    });
                }
                else {
                    callback(null,context);
                }
            }
        ],

        function (err, context) {
            console.log('removeProfileFromConversations(): exiting: err=%s,result=%s', err, context);
            callback( err, context );
        }
    );
};

ConversationHelper.prototype.leaveConversation = function( context, callback ) {
    var self = this;

    console.log('leaveConversation(): entered');
    async.waterfall(
        [
            function (callback) {

                model.Conversation.findOne({'_id': context.conversationId})
                    .exec(function( err, conversation ){
                        if ( err ) {
                            callback(err, null);
                        }
                        else {
                            if ( conversation ) {
                                conversation.envelope.latestMember = context.origin;
                                context.conversation = conversation;
                                callback(null, context);
                            }
                            else {
                                callback({message: 'conversation not found'}, null);
                            }
                        }
                    });
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
                self.updateLastEvent( context.origin, 'LEFT', context.conversation);

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
            console.log('leaveConversation(): exit: error %s', err);
            callback( err, context.conversation );
        }
    );
};

ConversationHelper.prototype.acceptConversation = function( context, callback ) {
    var self = this;

    console.log('acceptConversation(): entered');
    async.waterfall(
        [
            function (callback) {

                model.Conversation.findOne({'_id': context.conversationId})
                    .exec(function( err, conversation ){
                        if ( err ) {
                            callback(err, null);
                        }
                        else {
                            if ( conversation ) {
                                conversation.envelope.latestMember = context.origin;
                                context.conversation = conversation;
                                callback(null, context);
                            }
                            else {
                                callback({message: 'conversation not found'}, null);
                            }
                        }
                    });
            },

            // update Conversation
            function(context,callback) {

                // bump accepts
                if ( context.conversation.state.accepts + 1 > context.conversation.state.maxAccepts ) {
                    callback( new Error('Max Accepts Reached'), null );
                }

                ++context.conversation.state.accepts;
                self.updateLastEvent( context.origin, 'ACCEPTED', context.conversation);

                if ( context.conversation.state.accepts === context.conversation.state.maxAccepts ) {
                    self.removeAllMembersWhoDontHaveLastEventFromConversationExceptingOwner( 'ACCEPTED', context.conversation );
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
            console.log('acceptConversation(): exit: error %s', err);
            if (!err) {
                callback(err, context.conversation);
            } else {
                callback(err, context);
            }
        }
    );
};

ConversationHelper.prototype.rejectConversation = function( context, callback ) {
    var self = this;

    console.log('rejectConversation(): entered');
    async.waterfall(
        [
            function (callback) {

                model.Conversation.findOne({'_id': context.conversationId})
                    .exec(function( err, conversation ){
                        if ( err ) {
                            callback(err, null);
                        }
                        else {
                            if ( conversation ) {
                                conversation.envelope.latestMember = context.origin;
                                context.conversation = conversation;
                                callback(null, context);
                            }
                            else {
                                callback({message: 'conversation not found'}, null);
                            }
                        }
                    });
            },

            // update Conversation
            function(context,callback) {

                ++context.conversation.state.rejects;
                self.updateLastEvent( context.origin, 'REJECTED', context.conversation );
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
            console.log('rejectConversation(): exit: error %s', err);
            callback( err, context );
        }
    );
};

ConversationHelper.prototype.okConversation = function( context, callback ) {
    var self = this;

    console.log('okConversation(): entered');
    async.waterfall(
        [
            function (callback) {

                model.Conversation.findOne({'_id': context.conversationId})
                    .exec(function( err, conversation ){
                        if ( err ) {
                            callback(err, null);
                        }
                        else {
                            if ( conversation ) {
                                conversation.envelope.latestMember = context.origin;
                                context.conversation = conversation;
                                callback(null, context);
                            }
                            else {
                                callback({message: 'conversation not found'}, null);
                            }
                        }
                    });
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
                self.updateLastEvent( context.origin, 'OK', context.conversation );

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
            console.log('okConversation(): exit: error %s', err);
            callback( err, context );
        }
    );
};

ConversationHelper.prototype.closeConversation = function( context, callback ) {
    var self = this;

    console.log('closeConversation(): entered');
    async.waterfall(
        [
            function (callback) {

                model.Conversation.findOne({'_id': context.conversationId})
                    .exec(function( err, conversation ){
                        if ( err ) {
                            callback(err, null);
                        }
                        else {
                            if ( conversation ) {
                                conversation.envelope.latestMember = context.origin;
                                context.conversation = conversation;
                                callback(null, context);
                            }
                            else {
                                callback({message: 'conversation not found'}, null);
                            }
                        }
                    });
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
                self.updateLastEvent( context.origin, 'CLOSED', context.conversation);

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
            console.log('closeConversation(): exit: error %s', err);
            callback( err, context );
        }
    );
};



ConversationHelper.prototype.forwardConversation = function( context, callback ) {
    var self = this;

    console.log('forwardConversation(): entered');
    async.waterfall(
        [
            function (callback) {

                if ( context.forward && !context.forward.isArray ) {
                    context.newMembers = [];
                    context.newMembers.push(context.forward);
                }
                else {
                    context.newMembers = context.forward;
                }

                model.Conversation.findOne({'_id': context.conversationId})
                    .exec(function( err, conversation ){
                        if ( err ) {
                            callback(err, null);
                        }
                        else {
                            if ( conversation ) {
                                conversation.envelope.latestMember = context.origin;
                                context.conversation = conversation;
                                callback(null, context);
                            }
                            else {
                                callback({message: 'conversation not found'}, null);
                            }
                        }
                    });
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
            console.log('forwardConversation(): exit: error %s', err);
            callback( err, context );
        }
    );
};

ConversationHelper.prototype.delegateConversation = function( context, callback ) {
    var self = this;

    console.log('delegateConversation(): entered');
    async.waterfall(
        [
            function (callback) {
                context.newMembers = [];
                context.newMembers.push(context.delegate);

                model.Conversation.findOne({'_id': context.conversationId})
                    .exec(function( err, conversation ){
                        if ( err ) {
                            callback(err, null);
                        }
                        else {
                            if ( conversation ) {
                                conversation.envelope.latestMember = context.origin;
                                context.conversation = conversation;
                                callback(null, context);
                            }
                            else {
                                callback({message: 'conversation not found'}, null);
                            }
                        }
                    });
            },

            // remove conversation from origin Inbox
            function(context, callback) {
                self.removeConversationFromOriginMembersInbox(context, callback);
            },

            // remove origin from active members
            function(context,callback) {

                context.conversation.envelope.members.pull({_id: new ObjectId(context.origin)});
                --context.conversation.state.curMemberCount;
                self.updateLastEvent( context.origin, 'DELEGATED', context.conversation);

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
            console.log('delegateConversation(): exit: error %s', err);
            callback( err, context );
        }
    );
};

ConversationHelper.prototype.escalateConversation = function( context, callback ) {
    var self = this;

    console.log('escalateConversation(): entered');
    async.waterfall(
        [
            function (callback) {

                if ( self.escalationTriggerMet(context) ) {

                    context.newMembers = context.escalate.steps[context.currentState].targets;

                    model.Conversation.findOne({'_id': context.conversationId})
                        .exec(function( err, conversation ){
                            if ( err ) {
                                callback(err, null);
                            }
                            else {
                                if ( conversation ) {
                                    conversation.envelope.latestMember = context.origin;
                                    context.conversation = conversation;
                                    callback(null, context);
                                }
                                else {
                                    callback({message: 'conversation not found'}, null);
                                }
                            }
                        });
                }
                else {
                    callback( Error('Escalation Aborted'), null );
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

                    context.action = 'escalationStep';

                    var published = self._schedulerPublisher.publish('SchedulerQueue', context);
                    published.then(function() {
                        callback(null, context);
                    }).catch(function(err){
                        callback(Error('Publish Failed: ' + err), null);
                    });
                }
                else {
                    // TODO : do something to indicate that escalation is exhausted
                    callback(null, context);
                }
            }
        ],

        function (err, context) {
            console.log('escalateConversation(): exit: error %s', err);
            callback( err, context );
        }
    );
};

ConversationHelper.prototype.replyToConversation = function( context, callback ) {

    console.log('replyToConversation(): entered');
    async.waterfall(
        [
            function (callback) {
                model.Conversation.findOne({'_id': context.conversationId})
                    .exec(function( err, conversation ){
                        if ( err ) {
                            callback(err, null);
                        }
                        else {
                            if ( conversation ) {
                                conversation.envelope.latestMember = context.origin;
                                context.conversation = conversation;
                                callback(null, context);
                            }
                            else {
                                callback({message: 'conversation not found'}, null);
                            }
                        }
                    });
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
            console.log('replyToConversation(): exit: error %s', err);
            callback( err, context );
        }
    );
};

ConversationHelper.prototype.readConversation = function( context, callback ) {
    var self = this;

    console.log('readConversation(): entered');
    async.waterfall(
        [
            function (callback) {

                model.Conversation.findOne({'_id': context.conversationId})
                    .exec(function( err, conversation ){
                        if ( err ) {
                            callback(err, null);
                        }
                        else {
                            if ( conversation ) {
                                conversation.envelope.latestMember = context.origin;
                                context.conversation = conversation;
                                callback(null, context);
                            }
                            else {
                                callback({message: 'conversation not found'}, null);
                            }
                        }
                    });
            },

            function(context,callback) {
                if (self.getCurrentState(context.origin, context.conversation) === 'UNOPENED') {
                    self.updateLastEvent(context.origin, 'READ', context.conversation);
                }
                callback(null,context);
            },

            // remove profile from Conversation
            function(context,callback) {

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
            console.log('readConversation(): exit: error %s', err);
            callback( err, context );
        }
    );
};


ConversationHelper.prototype.getConversationsInInbox = function( context, callback ) {
    var self = this;

    for (var i=0; i < context.inbox.length; i++) {
        context.inbox[i] = context.inbox[i].toHexString();
    }

    model.Conversation.find({'_id': { $in: context.inbox }})
        .populate('envelope.origin', 'displayName _id')
        .populate('envelope.members', 'displayName _id')
        .populate('state.members.member', 'displayName _id')
        .exec(function( err, conversations){
            if ( err ) {
                callback(err, null);
            }
            else {
                if ( conversations instanceof Array ) {
                    for (var i = 0; i < conversations.length; i++) {
                        conversations[i] = conversations[i].toJSON();
                        conversations[i] = ConversationHelper.prototype.allowableActions(conversations[i], context.origin);
                    }
                }
                else {
                    conversations = conversations.toJSON();
                    conversations = ConversationHelper.prototype.allowableActions(conversations, context.origin);
                }

                context.conversations = self._notificationHelper.convertConversationToNotification(conversations, context.origin);

                callback(null, context);
            }
        });
};

ConversationHelper.prototype.allowableActions = function(c, user){
        if (c.envelope.origin._id.toHexString() === user) {
            c.allowableActions = ConversationHelper.prototype.getOriginAllowableActions(c);
        }
        else {
            c.allowableActions = ConversationHelper.prototype.getParticipantAllowableActions(c);
        }
        return c;
};

