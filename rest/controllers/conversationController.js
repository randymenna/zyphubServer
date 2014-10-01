/**
 * Created by al on 9/4/14.
 */

var async                   = require('async');
var genericMongoController  = require('./genericMongoController')
var conversation            = require('../../models/conversation');

exports.getConversations = function (req, res) {

    console.log("getConversations(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};
                var accountId = genericMongoController.extractAccountId(req);
                context.accountId = accountId;
                console.log("getContacts(): accountId=%s", accountId);
                callback(null, context);
            },

            function (context, callback) {
                conversation.Conversation.find().exec(function( err, conversations){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.conversations = conversations;
                        callback(null, context);
                    }
                })
            }

        ],

        function (err, context) {
            console.log("getConversations(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context);
            } else {
                res.json(401, err);
            }
        }
    );
};

exports.newConversation = function (req, res) {

    console.log("newConversation(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};
                var accountId = genericMongoController.extractAccountId(req);
                context.accountId = accountId;
                console.log("getContacts(): accountId=%s", accountId);
                callback(null, context);
            }
            /*,

            function (context, callback) {
                var p = new profile.Person({
                                            entity:req.body.entity,
                                            type:req.body.type,
                                            presence:req.body.presence,
                                            memberOf: req.body.memberOf });
                context.profile = p;

                context.profile.save(function( err, profile){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        callback(null, context);
                    }
                })
            }
            */
        ],

        function (err, context) {
            console.log("newConversation(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.profile);
            } else {
                res.json(401, err);
            }
        }
    );
};

