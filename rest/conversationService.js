/**
 * Created by al on 9/4/14.
 */

var ExchangePublisherFactory        = require('../util/bus/ExchangePublisherFactory');
var ConversationController           = require('./controllers/conversationController');
var cpBus                            = require('../bus');

module.exports = function() {

    var express = require('express');
    var app = express();

    app.get('/', ConversationController.getConversations);
    app.get('/:id', ConversationController.getOneConversation);
    app.post('/', ConversationController.newConversation);
    app.post('/:id/:action', ConversationController.updateConversation);

    cpBus.connection.on('error',function(err) {
        console.error("Conversation Controller: Unable to connect to bus: " + err);
    });

    cpBus.connection.on('ready',function() {

        var exchangePublisherFactory = new ExchangePublisherFactory(cpBus.connection);

        exchangePublisherFactory.createConversationExchangePublisher( function(conversationPublisher) {
            ConversationController.setConversationPublisher(conversationPublisher);
        });

        exchangePublisherFactory.createSchedulerExchangePublisher( function(schedulerPublisher) {
            ConversationController.setSchedulerPublisher(schedulerPublisher);
        });

        exchangePublisherFactory.createSocketIOExchangePublisher( function(socketIOPublisher) {
            ConversationController.setSocketIOPublisher(socketIOPublisher);
        });

        exchangePublisherFactory.createAuditTrailExchangePublisher( function(auditTrailPublisher) {
            ConversationController.setAuditTrailPublisher(auditTrailPublisher);
        });

    });

    return app;
}();