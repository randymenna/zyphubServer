var async                           = require('async');
var mongodbClient                   = require('./../mongodb-client/index');
var MessageDrivenBean               = require('./../util/mdb/messageDrivenBean');
var cpBus                           = require('./../bus/index');
var ConversationMessageHandler      = require('./../msgHandler/conversationMessageHandler');
var ExchangePublisherFactory        = require('./../util/bus/exchangePublisherFactory');
var NotificicationHelper            = require('./../util/notificationHelper');

var ConversationHelper              = require('./../rest/controllers/helper/conversationHelper');
var config                          = require('config');
var mongoose                        = require('mongoose');
var logger                          = require('../util/logger');
var CONSTANTS                       = require('../constants');

logger.startLogger('conversationRouter');

var messageDrivenBean = null;
var conversationHelper = new ConversationHelper();

/*
cpBus.connection.on('error',function(err) {
    console.log("unable to connect to cp bus:" + err);
});
*/

// INITIALIZATION CODE
// ONCE WE CAN CONNECT TO RABBIT MQ, TRY AND CONNECT TO MONGO, THEN START THE MDB
//cpBus.connection.on('ready',function() {
cpBus.promise.then(function(con){

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
                mongoose.connect('mongodb://cpadmin:cpadmin@ds047802.mongolab.com:47802/cp', {auto_reconnect: true},function(err){
                    if (err){
                        console.log('conversationRouter(): mongoose error: ', err);
                    }
                    else {
                        console.log('conversationRouter(): mongoose.connect ',config.mongo.dbName,'@',config.mongo.host,':',config.mongo.port);
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
    )
}, function(err){
    console.log("unable to connect to cp bus:" + err);
});
