/**
 * Created by randy on 9/4/14.
 */

var ExchangePublisherFactory        = require('../util/bus/ExchangePublisherFactory');
var ConversationController          = require('./controllers/conversationController');
var cpBus                           = require('../bus');
var ConversationHelper              = require('./controllers/helper/conversationHelper');
var passport                        = require('passport');

module.exports = function() {

    var express = require('express');
    var app = express();

    app.get('/', passport.authenticate('bearer', { session: false }), ConversationController.getConversations);
    app.get('/:id', passport.authenticate('bearer', { session: false }), ConversationController.getOneConversation);
    app.post('/', passport.authenticate('bearer', { session: false }), ConversationController.newConversation);
    app.put('/:id/:action', passport.authenticate('bearer', { session: false }), ConversationController.updateConversation);

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

        exchangePublisherFactory.createNotificationExchangePublisher( function(notificationPublisher) {
            ConversationController.setNotificationPublisher(notificationPublisher);
        });

        exchangePublisherFactory.createAuditTrailExchangePublisher( function(auditTrailPublisher) {
            ConversationController.setAuditTrailPublisher(auditTrailPublisher);
        });

        var conversationHelper = new ConversationHelper();
        ConversationController.setConversationHelper(conversationHelper);

    });

    return app;
}();