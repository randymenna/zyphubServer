/**
 * Created by randy on 9/4/14.
 */

var async                   = require('async');
var genericMongoController  = require('./genericMongoController')
var tag                     = require('../../models/tag');
var model                   = require('../../models/models');
var mongoose                = require('mongoose');
var tagHelper               = require('./helper/tagHelper');

var ObjectId = mongoose.Types.ObjectId;

exports.newTag = function (req, res) {

    console.log("newTag(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = req.body;
                context.owner = req.user.origin;

                callback(null, context);
            },

            function (context, callback) {

                var t = tagHelper.newTag(context);

                t.save(function( err, tag){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.tag = tagHelper.santize( tag );

                        callback(null, context);
                    }
                });
            }
        ],

        function (err, context) {
            console.log("newTag(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.tag);
            } else {
                res.json(400, err.message);
            }
        }
    );
};

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
                res.json(200, context.tag);
            } else {
                res.json(400, err.message);
            }
        }
    );
};
/*
    {
        enterprise: {profileId}
    }
 */

exports.getAll = function (req, res) {

    console.log("tags.getAll(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.search = {}
                context.search.owner = req.user.origin;

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
            console.log("tags.getAll(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.tags);
            } else {
                res.json(401, err);
            }
        }
    );
};

exports.getAllByProfileId = function (req, res) {

    console.log("tags.getAllByProfileId(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.search = {}
                context.search.owner = req.params.id;

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
            console.log("tags.getAllByProfileId(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.tags);
            } else {
                res.json(401, err);
            }
        }
    );
};

exports.getOneByProfileId = function (req, res) {

    console.log("tags.getAllByProfileId(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};

                context.search = {}
                context.search.owner = req.params.pid;
                context.search._id = req.params.tid;

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
            console.log("tags.getAllByProfileId(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.tags);
            } else {
                res.json(401, err);
            }
        }
    );
};

exports.getOne = function (req, res) {

    console.log("tags.getOne(): entered");
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
            console.log("tags.getOne(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.tag);
            } else {
                res.json(401, err);
            }
        }
    );
};

exports.getOneByProfileId = function (req, res) {

    console.log("tags.getOneByProfileId(): entered");
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
            console.log("tags.getOneByProfileId(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.tag);
            } else {
                res.json(401, err);
            }
        }
    );
};

exports.update = function (req, res) {

    console.log("tags.update(): entered");
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
            console.log("tags.update(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.tag);
            } else {
                res.json(401, err);
            }
        }
    );
};

exports.updateByProfileId = function (req, res) {

    console.log("tags.updateByProfileId(): entered");
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
            console.log("tags.updateByProfileId(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.tag);
            } else {
                res.json(401, err);
            }
        }
    );
};

exports.remove = function (req, res) {

    console.log("tags.remove(): entered");
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
            console.log("tags.remove(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.tag);
            } else {
                res.json(401, err);
            }
        }
    );
};

exports.removeAllByProfileId = function (req, res) {

    console.log("tags.remove(): entered");
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
            console.log("tags.remove(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.tag);
            } else {
                res.json(401, err);
            }
        }
    );
};

exports.removeOneByProfileId = function (req, res) {

    console.log("tags.remove(): entered");
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
            console.log("tags.remove(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.tag);
            } else {
                res.json(401, err);
            }
        }
    );
};