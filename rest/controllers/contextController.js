/**
 * Created by al on 9/4/14.
 */

var async                   = require('async');
var genericMongoController  = require('./genericMongoController')
var model                   = require('../../models/models');

var context = model.Context;

exports.getContexts = function (req, res) {

    console.log("getContexts(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};
                var accountId = genericMongoController.extractAccountId(req);
                context.accountId = accountId;
                console.log("getContexts(): accountId=%s", accountId);
                callback(null, context);
            },
            function (context, callback) {
                context.Context.find().exec(function( err, c){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.contexts = c;
                        callback(null, context);
                    }
                })
            },

            function (context, callback) {
                context.Context.find().exec(function( err, contexts){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.contexts.concat(contexts);
                        callback(null, context);
                    }
                })
            }
        ],

        function (err, context) {
            console.log("getContexts(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context);
            } else {
                res.json(401, err);
            }
        }
    );
};

exports.getOneContext = function (req, res) {

    console.log("getContexts(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};
                var accountId = genericMongoController.extractAccountId(req);
                context.accountId = accountId;
                context.id = req.params.id;
                console.log("getContexts(): accountId=%s", accountId);
                callback(null, context);
            },
            function (context, callback) {
                context.Context.find({_id:context.id}).exec(function( err, person){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.person = person;
                        callback(null, context);
                    }
                })
            }
        ],

        function (err, context) {
            console.log("getContexts(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.person);
            } else {
                res.json(401, err);
            }
        }
    );
};

exports.newContext = function (req, res) {

    console.log("newContext(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};
                var accountId = genericMongoController.extractAccountId(req);
                context.accountId = accountId;
                console.log("getContexts(): accountId=%s", accountId);
                callback(null, context);
            },

            function (context, callback) {
                var stringId = mongoose.Types.ObjectId().toHexString();
                stringId = 'c' + stringId.substring(1);
                var _id = mongoose.Types.ObjectId( stringId );

                var c = new context.Context({
                    _id: _id,
                    name: req.body.name,
                    label: req.body.label,
                    members: req.body.members
                });

                c.save(function( err, context){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.context = context;
                        callback(null, context);
                    }
                })
            }
        ],

        function (err, context) {
            console.log("newContext(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.context);
            } else {
                res.json(400, err.message);
            }
        }
    );
};

/* /context/:id/subscribe
 *
 * context:
 *      contextId
 *      member
 */

exports.subscribeToContext = function (req, res) {

    console.log("subscribeToContext(): entered");

    var context = {};
    var accountId = genericMongoController.extractAccountId(req);
    context.accountId = accountId;

    async.waterfall(
        [
            function (callback) {

                model.Context.findOneAndUpdate({'id': context.contextId},{$push: {inbox: context.member }}, function(err, c){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.context = c;
                        callback(null, context);
                    }
                });

                callback(null, context);
            }
        ],

        function (err, context) {
            console.log("subscribeToContext(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.context);
            } else {
                res.json(400, err.message);
            }
        }
    );
};

/* /context/:id/unsubscribe
 *
 * context:
 *      contextId
 *      member
 */

exports.unsubscribeToContext = function (req, res) {

    console.log("unsubscribeToContext(): entered");

    var context = {};
    var accountId = genericMongoController.extractAccountId(req);
    context.accountId = accountId;

    async.waterfall(
        [
            function (callback) {

                model.Context.findOneAndUpdate({'id': context.contextId},{$pull: {inbox: context.member }}, function(err, c){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.context = c;
                        callback(null, context);
                    }
                });

                callback(null, context);
            }
        ],

        function (err, context) {
            console.log("unsubscribeToContext(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.context);
            } else {
                res.json(400, err.message);
            }
        }
    );
};

/* /context/:id/meta
 *
 * context:
 *      origin
 *      contextId
 *      meta[]
 */

exports.addMetaToContext = function (req, res) {

    console.log("addMetaToContext(): entered");

    var context = {};
    var accountId = genericMongoController.extractAccountId(req);
    context.accountId = accountId;

    async.waterfall(
        [
            function (callback) {

                model.Context.findOneAndUpdate({'id': context.contextId},{$push: {inbox: context.member }}, function(err, c){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.context = c;
                        callback(null, context);
                    }
                });

                callback(null, context);
            }
        ],

        function (err, context) {
            console.log("addMetaToContext(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.context);
            } else {
                res.json(400, err.message);
            }
        }
    );
};