/**
 * Created by randy on 9/4/14.
 */

var async                   = require('async');
var Tag                     = require('../../models/context');
var model                   = require('../../models/models');
var mongoose                = require('mongoose');
var tagHelper               = require('./helper/tagHelper');
var contextHelper           = require('./helper/contextHelper');

var ObjectId = mongoose.Types.ObjectId;

exports.newByProfileId = function (req, res) {

    console.log("newByProfileId(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = req.body;
                context.owner = req.params.id;

                callback(null, context);
            },

            function (context, callback) {
                context.search = {};
                context.search.label = context.context;
                contextHelper.getOne(context,function(err,ctx) {
                    if ( err )
                        callback(err,null);
                    else
                    if ( !ctx.ctx )
                        callback({error:"Context not found"},null);
                    else
                        callback(null,context);
                });
            },

            function (context, callback) {

                var t = tagHelper.newTag(context);

                t.save(function( err, tag){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.tag = tagHelper.sanitize( tag );

                        callback(null, context);
                    }
                });
            }
        ],

        function (err, context) {
            console.log("newByProfileId(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.status(200).json(context.tag);
            } else {
                res.status(400).json(err);
            }
        }
    );
};

exports.getAll = function (req, res) {

    console.log("tag.getAll(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.search = {}
                context.search.owner = ObjectId(req.user.origin);

                if ( req.body.enterprise ) {
                    context.search.enterprise = req.body.enterprise;
                }

                callback(null, context);
            },
            function (context, callback) {

                tagHelper.getAll(context,callback);
            }
        ],

        function (err, context) {
            console.log("tag.getAll(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.status(200).json(context.tag);
            } else {
                res.status(400).json(err);
            }
        }
    );
};

exports.getAllByProfileId = function (req, res) {

    console.log("tag.getAllByProfileId(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.search = {}
                context.search.owner = [ ObjectId(req.params.id) ];

                if ( req.body.enterprise ) {
                    context.search.enterprise = req.body.enterprise;
                }

                callback(null, context);
            },
            function (context, callback) {

                tagHelper.getAll(context,callback);
            }
        ],

        function (err, context) {
            console.log("tag.getAllByProfileId(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.status(200).json(context.tags);
            } else {
                res.status(400).json(err);
            }
        }
    );
};

exports.getOneByProfileId = function (req, res) {

    console.log("tag.getAllByProfileId(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.search = {}
                context.search.owner = ObjectId(req.params.pid);
                context.search._id = ObjectId(req.params.tid);

                if ( req.body.enterprise ) {
                    context.search.enterprise = req.body.enterprise;
                }

                callback(null, context);
            },
            function (context, callback) {

                tagHelper.getAll(context,callback);
            }
        ],

        function (err, context) {
            console.log("tag.getAllByProfileId(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.status(200).json(context.tag);
            } else {
                res.status(400).json(err);
            }
        }
    );
};

exports.getOne = function (req, res) {

    console.log("tag.getOne(): entered");
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

                tagHelper.getOne(context,callback);
            }
        ],

        function (err, context) {
            console.log("tag.getOne(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.status(200).json(context.tag);
            } else {
                res.status(400).json(err);
            }
        }
    );
};

exports.getOneByProfileId = function (req, res) {

    console.log("tag.getOneByProfileId(): entered");
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

                tagHelper.getOne(context,callback);
            }
        ],

        function (err, context) {
            console.log("tag.getOneByProfileId(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.status(200).json(context.tag);
            } else {
                res.status(400).json(err);
            }
        }
    );
};

exports.update = function (req, res) {

    console.log("tag.update(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.search = {};
                context.search._id = ObjectId(req.params.id);
                context.update = tagHelper.fixDates(req.body);

                callback(null, context);
            },
            function (context, callback) {

                tagHelper.updateOne(context,callback);
            }
        ],

        function (err, context) {
            console.log("tag.update(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.status(200).json(context.tag);
            } else {
                res.status(400).json(err);
            }
        }
    );
};

exports.updateByProfileId = function (req, res) {

    console.log("tag.updateByProfileId(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.search = {};
                context.search.owner = ObjectId(req.params.pid);
                context.search._id = ObjectId(req.params.tid);
                context.update = tagHelper.fixDates(req.body);

                callback(null, context);
            },
            function (context, callback) {

                tagHelper.updateOne(context,callback);
            }
        ],

        function (err, context) {
            console.log("tag.updateByProfileId(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.status(200).json(context.tag);
            } else {
                res.status(400).json(err);
            }
        }
    );
};

exports.remove = function (req, res) {

    console.log("tag.remove(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.search = {};
                context.search._id = ObjectId(req.params.id);

                callback(null, context);
            },
            function (context, callback) {

                tagHelper.removeOne(context,callback);
            }
        ],

        function (err, context) {
            console.log("tag.remove(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.status(200).json(context.tag);
            } else {
                res.status(400).json(err);
            }
        }
    );
};

exports.removeAllByProfileId = function (req, res) {

    console.log("tag.remove(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.search = {};
                context.search.owner = ObjectId(req.params.id);

                callback(null, context);
            },
            function (context, callback) {

                tagHelper.removeAll(context,callback);
            }
        ],

        function (err, context) {
            console.log("tag.remove(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.status(200).json(context.tag);
            } else {
                res.status(400).json(err);
            }
        }
    );
};

exports.removeOneByProfileId = function (req, res) {

    console.log("tag.remove(): entered");
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

                tagHelper.removeOne(context,callback);
            }
        ],

        function (err, context) {
            console.log("tag.remove(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.status(200).json(context.tag);
            } else {
                res.status(400).json(err);
            }
        }
    );
};