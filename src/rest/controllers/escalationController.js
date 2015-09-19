/**
 * Created by peter on 10/20/14
 */
var mongoose                = require('mongoose');
var async                   = require('async');
var genericMongoController  = require('./genericMongoController');
var model                   = require('../../models/models');

exports.newEscalation = function (req, res) {

    var context = {};

    console.log("newEscalation(): entered " + req.body.name);
    async.waterfall(
        [
            function (callback) {
                var context = {};
                var accountId = genericMongoController.extractAccountId(req);

                context.accountId = accountId;
                context.profileId = req.params.profileId;

                callback(null, context);
            },

            function (context, callback) {
                var context = {};
                context.action = "new";

                var esc = new model.Escalation({
                    name: req.body.name,
                    description: req.body.description,
                    enterprise: req.body.enterprise
                });

                req.body.steps.forEach(function(stepValue) {
                    var targets = [];
                    stepValue.targets.forEach(function(target) {
                        targets.push(mongoose.Types.ObjectId(target));
                    });
                    esc.steps.push({
                        time: stepValue.time,
                        targets: targets,
                        trigger: stepValue.trigger
                    });
                });

                // is owner implied by the user posting, or does the payload specify?
                esc.owner = mongoose.Types.ObjectId(context.profileId);

                context.escalation = esc;

                callback(null, context);
            },

            function (context, callback) {
                context.escalation.save(function( err, escalation){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        callback(null, context);
                    }
                });
            }

            // notify socket io
/*
            function(context, callback) {

                context.action = "new";
                _notificationPublisher.publish('SocketIOQueue',context, function( error ){
                    if ( error )
                        callback(Error("SocketIO Publish Failed"), null);
                    else
                        callback(null, context);
                });

            }
*/
        ],

        function (err, context) {
            console.log("newEscalation(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.status(200).json(context.escalation);
            } else {
                res.status(400).json(err.message);
            }
        }
    );
};

exports.getEscalations = function (req, res) {

    console.log("getEscalations(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};
                var accountId = genericMongoController.extractAccountId(req);

                context.accountId = accountId;
                context.profileId = req.params.profileId;

                callback(null, context);
            },

            function(context,callback) {
                model.Escalation.find()
                    .populate('steps.step.targets.target', 'label _id')
                    .populate('owners.owner', 'label _id')
                    .populate('stats.members.member', 'label')
                    .exec(function( err, conversations){
                        if ( err ) {
                            callback(err, null);
                        }
                        else {
                            context.escalations = conversations;
                            callback(null, context);
                        }
                    });
            }
        ],

        function (err, context) {
            console.log("getEscalations(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.status(200).json(context.escalations);
            } else {
                res.jstatus(401).json(err.message);
            }
        }
    );
};
