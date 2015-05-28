/**
 * Created by randy on 9/4/14.
 */

var config                  = require('config');
var async                   = require('async');
var moment                  = require('moment');
var model                   = require('../../models/models');
var jwt                     = require('jwt-simple');

// TODO: move this to token helper
var validate = function(token,secret) {
    var decoded = null;

    try {
        decoded = jwt.decode( token, secret );
        if ( decoded.exp ) {
            var now = moment();
            var expires = moment(decoded.expires);
            if ( now.isAfter(expires) )
                decoded = null;
        }
    }
    catch( e ) {
        console.log("validate(): %s",e);
    }
    return decoded;
};

exports.getWebHookUrl = function (req, res) {
    var apiKey = req.body.apiKey;

    console.log("getWebHookUrl(): entered");
    async.waterfall(
        [
            function (callback) {

                if (!apiKey) {
                    callback(Error('missing parameter'), null);
                }
                else {
                    var token = validate(apiKey, config.jwt.apikeysecret);

                    if (token) {
                        var webHook = {
                            enterprise: token.aud,
                            url: url
                        };
                        model.Webhook.findOne({enterprise: token.aud})
                            .exec(function (err, webhook) {
                                if (err) {
                                    callback(err, null);
                                }
                                else {
                                    callback(null, webhook);
                                }
                            });
                    }
                    else {
                        callback(Error('Invalid API KEY'),null);
                    }
                }
            }
        ],

        function (err, webhook) {
            var url = webhook ? webhook.url : 'none set';
            console.log("getWebHookUrl(): exiting: err=%s,result=%s", err, webhook);
            if (!err) {
                res.status(200).json({url:url});
            } else {
                res.status(401).json(err);
            }
        }
    );
};

exports.setWebHookUrl = function (req, res) {
    var apiKey = req.body.apiKey;
    var url = req.body.url;

    console.log("setWebHookUrl(): entered");
    async.waterfall(
        [
            function (callback) {

                if (!apiKey || !url) {
                    callback(Error('missing parameter'), null);
                }
                else {
                    var token = validate(apiKey, config.jwt.apikeysecret);

                    if (token) {
                        var webHook = {
                            enterprise: token.aud,
                            url: url
                        };
                        model.Webhook.update({enterprise: token.aud},webHook,{upsert: true})
                            .exec(function (err, webhook) {
                                if (err) {
                                    callback(err, null);
                                }
                                else {
                                    callback(null, 'done');
                                }
                            });
                    }
                    else {
                        callback(Error('Invalid API KEY'),null);
                    }
                }
            }
        ],

        function (err, context) {
            console.log("setWebHookUrl(): exiting: err=%s,result=%s", err, context);
            if (!err) {
                res.status(200).json({url:url});
            } else {
                res.status(401).json(err);
            }
        }
    );
};

exports.justEcho = function (req, res) {

    console.log("Notification: ",JSON.stringify(req.body));
    res.status(200).json({status:'ok'});
};

