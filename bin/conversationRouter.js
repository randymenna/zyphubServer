var async                           = require('async');
var config                          = require('config');
var mongoose                        = require('mongoose');
var mongodbClient                   = require('../src/mongodb-client/index');
var MessageDrivenBean               = require('../src/util/mdb/messageDrivenBean');
var cpBus                           = require('../src/bus');
var ConversationMessageHandler      = require('../src/msgHandler/conversationMessageHandler');
var ExchangePublisherFactory        = require('../src/util/bus/exchangePublisherFactory');
var NotificicationHelper            = require('../src/util/notificationHelper');
var ConversationHelper              = require('../src/rest/controllers/helper/conversationHelper');
var logger                          = require('../src/util/logger');
var CONSTANTS                       = require('../src/constants');

logger.startLogger('conversationRouter');

var conversationHelper = new ConversationHelper();

// INITIALIZATION CODE
// ONCE WE CAN CONNECT TO RABBIT MQ, TRY AND CONNECT TO MONGO, THEN START THE MDB
cpBus.promise.then(function(){

    console.log('Connected to CP Bus');
    var exchangePublisherFactory = new ExchangePublisherFactory(cpBus.connection);

    async.waterfall(
        [
            function(callback) {
                mongodbClient.init(function(error) {

                    var context = {};
                    console.log('conversationRouter(): mongodb Client init');

                    callback(error,context);
                });
            },

            function(context, callback) {

                exchangePublisherFactory.createAuditTrailExchangePublisher(function(auditTrailPublisher) {
                    console.log('conversationRouter(): auditTrailPublisher');
                    context.auditTrailPublisher = auditTrailPublisher;
                    callback(null,context);
                });
            },

            function(context, callback) {

                exchangePublisherFactory.createNotificationExchangePublisher(function(notificationPublisher) {
                    console.log('conversationRouter(): notificationPublisher');
                    context.notificationPublisher = notificationPublisher;
                    callback(null,context);
                });
            },

            function(context, callback) {

                console.log('conversationRouter(): NotificicationHelper');
                context.notificationHelper = new NotificicationHelper();
                callback(null,context);
            },

            function(context, callback) {

                exchangePublisherFactory.createSchedulerExchangePublisher(function(schedulerPublisher) {
                    console.log('conversationRouter(): schedulerPublisher');
                    context.schedulerPublisher = schedulerPublisher;
                    callback(null,context);
                });
            },

            function(context, callback) {

                var conversationHandler = new ConversationMessageHandler();
                conversationHandler.setAuditTrailPublisher(context.auditTrailPublisher);
                conversationHandler.setNotificationPublisher(context.notificationPublisher);
                conversationHandler.setNotificationHelper(context.notificationHelper);
                conversationHandler.setSchedulerPublisher(context.schedulerPublisher);
                conversationHandler.setConversationHelper( conversationHelper );

                //mongoose.connect(config.mongo.host, config.mongo.dbName, config.mongo.port, {auto_reconnect: true},function(err){
                mongoose.connect(config.mongo.url, {auto_reconnect: true},function(err){
                    if (err){
                        console.log('conversationRouter(): mongoose error: ', err);
                    }
                    else {
                        console.log('conversationRouter(): mongoose.connect ',config.mongo.url);
                    }
                });

                try {
                    var messageDrivenBean = new MessageDrivenBean(cpBus.connection, CONSTANTS.BUS.DIRECT, CONSTANTS.BUS.CONVERSATION_ROUTER, conversationHandler, CONSTANTS.BUS.CONVERSATION_WORKERS);
                    messageDrivenBean.start();
                } catch(exception){
                    console.log('conversationRouter(): mdb.exception', exception);
                }
                callback(null, 'done');
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
    );
}, function(err){
    console.log('unable to connect to cp bus:' + err);
});
