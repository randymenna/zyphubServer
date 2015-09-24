var async                           = require('async');
var config                          = require('config');
var mongoose                        = require('mongoose');
var model                           = require('../src/models/models');
var MessageDrivenBean               = require('../src/util/mdb/messageDrivenBean');
var CPBus                           = require('../src/bus');
var WebHookMessageHandler           = require('../src/msgHandler/webHookMessageHandler');
var NotificationHelper              = require('../src/util/notificationHelper');
var ConversationHelper              = require('../src/rest/controllers/helper/conversationHelper');
var logger                          = require('../src/util/logger');
var CONSTANTS                       = require('../src/constants');

var cpBus = new CPBus();
logger.startLogger('webhookServer');

cpBus.start().then(function(busConnection){

    var enterprise = config.webhook.enterprise;
    var webHookUrl;

    async.waterfall(
        [
            function(callback) {

                mongoose.connect(config.mongo.url, {auto_reconnect: true},function(err){
                    if (err){
                        console.log('webhookServer(): mongoose error: ', err);
                    }
                    else {
                        console.log('webhookServer(): mongoose.connect:',config.mongo.url);
                    }
                });
                var context = {};

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
                            console.log( Error('Can\'t find enterprise',enterprise) );
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
                    var messageDrivenBean = new MessageDrivenBean(busConnection, CONSTANTS.BUS.FANOUT, CONSTANTS.BUS.NOTIFIER, webHookHandler, CONSTANTS.BUS.NOTIFICATION_WORKERS);
                    cpBus.setBeanRestart(messageDrivenBean.start.bind(messageDrivenBean));
                    messageDrivenBean.start();
                } catch(exception){
                    console.log('webhook(): mdb.exception', exception);
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


