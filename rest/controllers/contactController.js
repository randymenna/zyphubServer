/**
 * Created by al on 9/4/14.
 */

var async                   = require('async');
var genericMongoController  = require('./genericMongoController')
var profile                 = require('../../models/profile');

exports.getContacts = function (req, res) {

    console.log("getContacts(): entered");
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
                profile.Person.find().exec(function( err, people){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.profiles = people;
                        callback(null, context);
                    }
                })
            },

            function (context, callback) {
                profile.Group.find().exec(function( err, groups){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.profiles.concat(groups);
                        callback(null, context);
                    }
                })
            }
        ],

        function (err, context) {
            console.log("getContacts(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context);
            } else {
                res.json(401, err);
            }
        }
    );
};

exports.newContact = function (req, res) {

    console.log("newContact(): entered");
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
        ],

        function (err, context) {
            console.log("newContact(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.profile);
            } else {
                res.json(401, err);
            }
        }
    );
};

