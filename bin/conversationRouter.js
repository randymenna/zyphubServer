var async                           = require('async');
var mongodbClient                   = require('./../mongodb-client/index');
var MessageDrivenBean               = require('./../util/mdb/messageDrivenBean');
var cpBus                           = require('./../bus/index');
var ConversationMessageHandler      = require('./../msgHandler/conversationMessageHandler');
var ExchangePublisherFactory        = require('./../util/bus/exchangePublisherFactory');

var ConversationHelper              = require('./../rest/controllers/helper/conversationHelper');
var config                          = require('config');
var mongoose                        = require('mongoose');

var messageDrivenBean = null;
var conversationHelper = new ConversationHelper();

cpBus.connection.on('error',function(err) {
    console.log("unable to connect to cp bus:" + err);
});

// INITIALIZATION CODE
// ONCE WE CAN CONNECT TO RABBIT MQ, TRY AND CONNECT TO MONGO, THEN START THE MDB
cpBus.connection.on('ready',function() {

    var exchangePublisherFactory = new ExchangePublisherFactory(cpBus.connection);

    async.waterfall(
        [
            function(callback) {
                mongodbClient.init(function(error) {

                    var context = {};

                    callback(error,context);
                });
            },

            function(context, callback) {

                exchangePublisherFactory.createAuditTrailExchangePublisher(function(auditTrailPublisher) {
                    context.auditTrailPublisher = auditTrailPublisher;
                    callback(null,context);
                });
            },

            function(context, callback) {

                exchangePublisherFactory.createNotificationExchangePublisher(function(notificationPublisher) {
                    context.notificationPublisher = notificationPublisher;
                    callback(null,context);
                });
            },

            function(context, callback) {

                exchangePublisherFactory.createSchedulerExchangePublisher(function(schedulerPublisher) {
                    context.schedulerPublisher = schedulerPublisher;
                    callback(null,context);
                });
            },

            function(context, callback) {

                var conversationHandler = new ConversationMessageHandler();
                conversationHandler.setAuditTrailPublisher(context.auditTrailPublisher);
                conversationHandler.setNotificationPublisher(context.notificationPublisher);
                conversationHandler.setSchedulerPublisher(context.schedulerPublisher);
                conversationHandler.setConversationHelper( conversationHelper );

                mongoose.connect(config.mongo.host, config.mongo.dbName, config.mongo.port, {auto_reconnect: true});

                messageDrivenBean = new MessageDrivenBean('ConversationEngine',conversationHandler);
                callback(null,'done');
            }
        ],
        function(err,result) {
            if (err) {
                console.error('Error Occurred while Initializing Conversation MDB' + err + result);
                throw err;
            } else {
                console.info('Conversation MDB Successfully Initialized');
            }
        }
    )
});