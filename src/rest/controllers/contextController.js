/**
 * Created by randy on 9/4/14.
 */

var async                   = require('async');
var Context                 = require('../../models/context');
var model                   = require('../../models/models');
var mongoose                = require('mongoose');
var contextHelper           = require('./helper/contextHelper');

var ObjectId = mongoose.Types.ObjectId;

exports.newContext = function (req, res) {

    console.log('newContext(): entered');
    async.waterfall(
        [
            function (callback) {
                var context = req.body;
                context.owner = req.user.origin;

                callback(null, context);
            },

            function (context, callback) {

                var search = {};
                search.label = context.label;
                model.Context.findOne(search).exec(function( err, ctx){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        if (ctx)
                            callback({error: 'Context Label already exists'}, null);
                        else
                            callback(null, context);
                    }
                });
            },

            function (context, callback) {

                var t = contextHelper.newContext(context);

                t.save(function( err, ctx){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.ctx = contextHelper.sanitize( ctx );

                        callback(null, context);
                    }
                });
            }
        ],

        function (err, context) {
            console.log('newContext(): exiting: err=%s,result=%s', err, context);
            if (!err) {
                res.status(200).json(context.ctx);
            } else {
                res.status(400).json(err);
            }
        }
    );
};

exports.newByProfileId = function (req, res) {

    console.log('newByProfileId(): entered');
    async.waterfall(
        [
            function (callback) {
                var context = req.body;
                context.owner = req.params.id;

                callback(null, context);
            },

            function (context, callback) {

                var t = contextHelper.newContext(context);

                t.save(function( err, ctx){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.ctx = contextHelper.sanitize( ctx );

                        callback(null, context);
                    }
                });
            }
        ],

        function (err, context) {
            console.log('newByProfileId(): exiting: err=%s,result=%s', err, context);
            if (!err) {
                res.status(200).json(context.ctx);
            } else {
                res.status(400).json(err);
            }
        }
    );
};

exports.getAll = function (req, res) {

    console.log('ctx.getAll(): entered');
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.search = {};
                context.search.owner = req.user.origin;

                if ( req.body.enterprise ) {
                    context.search.enterprise = req.body.enterprise;
                }

                callback(null, context);
            },
            function (context, callback) {

                contextHelper.getAll(context,callback);
            }
        ],

        function (err, context) {
            console.log('ctx.getAll(): exiting: err=%s,result=%s', err, context);
            if (!err) {
                res.status(200).json(context.ctx);
            } else {
                res.status(400).json(err);
            }
        }
    );
};

exports.getAllByProfileId = function (req, res) {

    console.log('ctx.getAllByProfileId(): entered');
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.search = {};
                context.search.owner = req.params.id;

                if ( req.body.enterprise ) {
                    context.search.enterprise = req.body.enterprise;
                }

                callback(null, context);
            },
            function (context, callback) {

                contextHelper.getAll(context,callback);
            }
        ],

        function (err, context) {
            console.log('ctx.getAllByProfileId(): exiting: err=%s,result=%s', err, context);
            if (!err) {
                res.status(200).json(context.ctx);
            } else {
                res.status(400).json(err);
            }
        }
    );
};

exports.getOneByProfileId = function (req, res) {

    console.log('ctx.getAllByProfileId(): entered');
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.search = {};
                context.search.owner = req.params.pid;
                context.search._id = req.params.tid;

                if ( req.body.enterprise ) {
                    context.search.enterprise = req.body.enterprise;
                }

                callback(null, context);
            },
            function (context, callback) {

                contextHelper.getAll(context,callback);
            }
        ],

        function (err, context) {
            console.log('ctx.getAllByProfileId(): exiting: err=%s,result=%s', err, context);
            if (!err) {
                res.status(200).json(context.ctx);
            } else {
                res.status(400).json(err);
            }
        }
    );
};

exports.getOne = function (req, res) {

    console.log('ctx.getOne(): entered');
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.search = {};
                context.search._id = ObjectId(req.params.id);
                //context.search.owner = req.user.origin;

                callback(null, context);
            },
            function (context, callback) {

                contextHelper.getOne(context,callback);
            }
        ],

        function (err, context) {
            console.log('ctx.getOne(): exiting: err=%s,result=%s', err, context);
            if (!err) {
                res.status(200).json(context.ctx);
            } else {
                res.status(400).json(err);
            }
        }
    );
};

exports.getOneByProfileId = function (req, res) {

    console.log('ctx.getOneByProfileId(): entered');
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.search = {};
                context.search._id = ObjectId(req.params.tid);
                context.search.owner = ObjectId(req.params.pid);

                callback(null, context);
            },
            function (context, callback) {

                contextHelper.getOne(context,callback);
            }
        ],

        function (err, context) {
            console.log('ctx.getOneByProfileId(): exiting: err=%s,result=%s', err, context);
            if (!err) {
                res.status(200).json(context.ctx);
            } else {
                res.status(400).json(err);
            }
        }
    );
};

exports.update = function (req, res) {

    console.log('ctx.update(): entered');
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.search = {};
                context.search._id = ObjectId(req.params.id);
                context.update = req.body;

                callback(null, context);
            },
            function (context, callback) {

                contextHelper.updateOne(context,callback);
            }
        ],

        function (err, context) {
            console.log('ctx.update(): exiting: err=%s,result=%s', err, context);
            if (!err) {
                res.status(200).json(context.ctx);
            } else {
                res.status(400).json(err);
            }
        }
    );
};

exports.updateByProfileId = function (req, res) {

    console.log('ctx.updateByProfileId(): entered');
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.search = {};
                context.search.owner = ObjectId(req.params.pid);
                context.search._id = ObjectId(req.params.tid);

                callback(null, context);
            },
            function (context, callback) {

                contextHelper.updateOne(context,callback);
            }
        ],

        function (err, context) {
            console.log('ctx.updateByProfileId(): exiting: err=%s,result=%s', err, context);
            if (!err) {
                res.status(200).json(context.ctx);
            } else {
                res.status(400).json(err);
            }
        }
    );
};

exports.remove = function (req, res) {

    console.log('ctx.remove(): entered');
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.search = {};
                context.search._id = ObjectId(req.params.id);

                callback(null, context);
            },
            function (context, callback) {

                contextHelper.removeOne(context,callback);
            }
        ],

        function (err, context) {
            console.log('ctx.remove(): exiting: err=%s,result=%s', err, context);
            if (!err) {
                res.status(200).json(context.ctx);
            } else {
                res.status(400).json(err);
            }
        }
    );
};

exports.removeAllByProfileId = function (req, res) {

    console.log('ctx.remove(): entered');
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.search = {};
                context.search.owner = ObjectId(req.params.id);

                callback(null, context);
            },
            function (context, callback) {

                contextHelper.removeAll(context,callback);
            }
        ],

        function (err, context) {
            console.log('ctx.remove(): exiting: err=%s,result=%s', err, context);
            if (!err) {
                res.status(200).json(context.ctx);
            } else {
                res.status(400).json(err);
            }
        }
    );
};

exports.removeOneByProfileId = function (req, res) {

    console.log('ctx.remove(): entered');
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.search = {};
                context.search.owner = ObjectId(req.params.pid);
                context.search._id = ObjectId(req.params.tid);

                callback(null, context);
            },
            function (context, callback) {

                contextHelper.removeOne(context,callback);
            }
        ],

        function (err, context) {
            console.log('ctx.remove(): exiting: err=%s,result=%s', err, context);
            if (!err) {
                res.status(200).json(context.ctx);
            } else {
                res.status(400).json(err);
            }
        }
    );
};