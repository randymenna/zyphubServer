/**
 * Created by al on 9/4/14.
 */

var async                   = require('async');
var genericMongoController  = require('./genericMongoController');
var model                   = require('../../models/models');


exports.getOneAuditTrail = function (req, res) {

    console.log("getOneAuditTrail(): entered");
    async.waterfall(
        [
            function (callback) {
                var context = {};
                var accountId = genericMongoController.extractAccountId(req);
                context.accountId = accountId;
                context.conversationId = req.body.conversationId;
                console.log("getOneAuditTrail(): accountId=%s", accountId);
                callback(null, context);
            },
            function (context, callback) {
                model.Audit.find({conversationId:context.conversationId}).sort(-created).exec(function( err, audits){
                    if ( err ) {
                        callback(err, null);
                    }
                    else {
                        context.audit = audits;
                        callback(null, context);
                    }
                });
            }
        ],

        function (err, context) {
            console.log("getOneAuditTrail(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.json(200, context.audit);
            } else {
                res.json(401, err);
            }
        }
    );
};
