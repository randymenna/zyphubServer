/**
 * Created by randy
 */
var mongodbClient                           = require('./../mongodb-client/index');
var cpBus                                   = require('./../bus/index');
var async                                   = require('async');
var https                                   = require('https');
var fs                                      = require('fs');
var config                                  = require('config');
var mongoose                                = require('mongoose');
var request                                 = require('request');

var MessageDrivenBean                       = require('./../util/mdb/messageDrivenBean');
var WebHookMessageHandler                   = require('./../msgHandler/webHookMessageHandler');
var ConversationHelper                      = require('./../rest/controllers/helper/conversationHelper');
var AuthenticationHelper                    = require('./../util/authenticationHelper');
var NotificationHelper                      = require('./../util/notificationHelper');
var model                                   = require('./../models/models');
var logger                                  = require('../util/logger');

logger.startLogger('webhookServer');

cpBus.connection.on('error',function(err) {
    console.log("unable to connect to cp bus:" + err);
});

cpBus.connection.on('ready',function() {

    var enterprise = config.webhook.enterprise;
    var webHookUrl;

    async.waterfall(
        [
            function(callback) {
                mongodbClient.init(function(error) {

                    var context = {};
                    callback(error,context);
                });
            },

            function(context, callback) {

                mongoose.connect(config.mongo.host, config.mongo.dbName, config.mongo.port, {auto_reconnect: true});
                var db = mongoose.connection;
                db.on('error', function(err){
                    console.error.bind(console, 'connection error:');
                    callback(err,null);
                });
                db.once('open', function() {
                    callback(null, context);
                });
            },

            function(context, callback) {

                model.Webhook.findOne({enterprise:enterprise})
                    .exec(function(err, webhook){
                        if ( err ) {
                            webHookUrl = config.webHook.url;
                            console.log( Error("Can't find enterprise",enterprise) );
                        }
                        else {
                            if (webhook) {
                                webHookUrl = webhook.url;
                            }
                        }

                        context.options = {
                            url: webHookUrl,
                            enterprise: enterprise
                        };

                        callback(null,context);
                    });
            },

            function(context, callback) {

                var webHookHandler = new WebHookMessageHandler(context.options);
                webHookHandler.setConversationHelper( new ConversationHelper() );
                webHookHandler.setNotificationHelper( new NotificationHelper() );

                messageDrivenBean = new MessageDrivenBean('CPNotification',webHookHandler, 1);

                callback(null,'done');
            }
        ],
        function(err,result) {
            if (err) {
                console.error('Error Occurred while Initializing Webhook MDB' + err + result);
                throw err;
            } else {
                console.info('Webhook MDB Successfully Initialized');
            }
        });
});


