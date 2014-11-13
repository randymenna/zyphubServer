var async                           = require('async');
var mongodbClient                   = require('./mongodb-client');
var MessageDrivenBean               = require('./util/mdb/MessageDrivenBean');
var cpBus                           = require('./bus');
var ConversationMessageHandler      = require('./msgHandler/ConversationMessageHandler');
var ExchangePublisherFactory        = require('./util/bus/ExchangePublisherFactory');
var ConversationHelper              = require('./util/ConversationHelper');
var config                          = require('config');
var mongoose                        = require('mongoose');

var messageDrivenBean = null;
var conversationHelper = new ConversationHelper();

cpBus.connection.on('error',function(err) {
    logger.error("unable to connect to cp bus:" + err);
});

// INITIALIZATION CODE
// ONCE WE CAN CONNECT TO RABBIT MQ, TRY AND CONNECT TO MONGO, THEN START THE MDB
cpBus.connection.on('ready',function() {

    var exchangePublisherFactory = new ExchangePublisherFactory(cpBus.connection);

    // INITIALIZATION CODE
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

                exchangePublisherFactory.createSocketIOExchangePublisher(function(socketIOPublisher) {
                    context.socketIOPublisher = socketIOPublisher;
                    callback(null,context);
                });
            },

            function(context, callback) {

                var conversationHandler = new ConversationMessageHandler();
                conversationHandler.setAuditTrailPublisher(context.auditTrailPublisher);
                conversationHandler.setSocketIOPublisher(context.socketIOPublisher);
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
