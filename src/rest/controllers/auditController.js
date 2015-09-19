/**
 * Created by randy on 9/4/14.
 */

var async                   = require('async');
var model                   = require('../../models/models');
var restHelper              = require('./helper/restHelper');


exports.getOneAuditTrail = function (req, res) {

    console.log("getOneAuditTrail(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};
                context.origin = req.user.origin;

                context.conversationId = req.params.id;

                console.log("getOneAuditTrail(): origin=%s", context.origin);
                callback(null, context);
            },

            function (context, callback) {
                model.AuditTrail.find({conversationId:context.conversationId})
                    .sort({timestamp: -1 })
                    .populate('origin', 'label id')
                    .populate('state.members.member', 'label')
                    .exec(function(err, audits){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.auditTrail = audits;
                        callback(null, context);
                    }
                });
            }
        ],

        function (err, context) {
            console.log("getOneAuditTrail(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.status(200).json(context.auditTrail);
            } else {
                res.status(401).json(err);
            }
        }
    );
};
