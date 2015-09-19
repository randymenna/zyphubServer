var async                           = require('async');
var config                          = require('config');
var mongoose                        = require('mongoose');
var https                           = require('https');
var fs                              = require('fs');
var request                         = require('request');
var model                           = require('../src/models/models');
var mongodbClient                   = require('../src/mongodb-client/index');
var MessageDrivenBean               = require('../src/util/mdb/messageDrivenBean');
var cpBus                           = require('../src/bus');
var WebHookMessageHandler           = require('../src/msgHandler/webHookMessageHandler');
var AuthenticationHelper            = require('../src/util/authenticationHelper');
var NotificationHelper              = require('../src/util/notificationHelper');
var ConversationHelper              = require('../src/rest/controllers/helper/conversationHelper');
var logger                          = require('../src/util/logger');
var CONSTANTS                       = require('../src/constants');

logger.startLogger('webhookServer');

cpBus.promise.then(function(con){

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

                //mongoose.connect(config.mongo.host, config.mongo.dbName, config.mongo.port, {auto_reconnect: true});
                mongoose.connect(config.mongo.url, {auto_reconnect: true},function(err){
                    if (err){
                        console.log('webhookServer(): mongoose error: ', err);
                    }
                    else {
                        console.log('webhookServer(): mongoose.connect:',config.mongo.url);
                    }
                });

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

                try {
                    var messageDrivenBean = new MessageDrivenBean(cpBus.connection, CONSTANTS.BUS.FANOUT, CONSTANTS.BUS.NOTIFIER, webHookHandler, 0);
                    messageDrivenBean.start();
                } catch(exception){
                    console.log('conversationRouter(): mdb.exception', exception);
                }

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


