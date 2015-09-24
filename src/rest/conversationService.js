/**
 * Created by randy on 9/4/14.
 */

var ExchangePublisherFactory        = require('../util/bus/exchangePublisherFactory');
var ConversationController          = require('./controllers/conversationController');
var CPBus                           = require('../bus/index');
var ConversationHelper              = require('./controllers/helper/conversationHelper');
var passport                        = require('passport');
var async                           = require('async');

var cpBus = new CPBus();

module.exports = function() {

    var express = require('express');
    var app = express();

    app.get('/', passport.authenticate('bearer', { session: false }), ConversationController.getConversations);
    app.get('/:id', passport.authenticate('bearer', { session: false }), ConversationController.getOneConversation);
    app.post('/', passport.authenticate('bearer', { session: false }), ConversationController.newConversation);
    app.put('/:id/:action', passport.authenticate('bearer', { session: false }), ConversationController.updateConversation);

    /*
    cpBus.connection.on('error',function(err) {
        console.error('Conversation Controller: Unable to connect to bus: ' + err);
    });
    */

    //cpBus.connection.on('ready',function() {
    cpBus.start().then(function(busConnection) {

        console.log('conversationService: connected to cp bus');
        var exchangePublisherFactory = new ExchangePublisherFactory(busConnection);

        async.waterfall(
            [
                function(callback) {
                    exchangePublisherFactory.createConversationExchangePublisher( function(conversationPublisher) {
                        ConversationController.setConversationPublisher(conversationPublisher);
                        console.log('conversationService: set conversation publisher');
                        callback();
                    });
                },
                function(callback) {
                    exchangePublisherFactory.createSchedulerExchangePublisher( function(schedulerPublisher) {
                        ConversationController.setSchedulerPublisher(schedulerPublisher);
                        console.log('conversationService: set scheduler publisher');
                        callback();
                    });
                },
                function(callback) {
                    exchangePublisherFactory.createNotificationExchangePublisher( function(notificationPublisher) {
                        ConversationController.setNotificationPublisher(notificationPublisher);
                        console.log('conversationService: set notifier publisher');
                        callback();
                    });
                },
                function(callback) {
                    exchangePublisherFactory.createAuditTrailExchangePublisher( function(auditTrailPublisher) {
                        console.log('conversationService: set audit trail publisher');
                        ConversationController.setAuditTrailPublisher(auditTrailPublisher);
                        callback();
                    });
                },
                function(callback) {
                    exchangePublisherFactory.createBillingExchangePublisher( function(billingPublisher) {
                        console.log('conversationService: set billing Publisher');
                        ConversationController.setBillingPublisher(billingPublisher);
                        callback();
                    });
                }
            ],
            function() {
                var conversationHelper = new ConversationHelper();
                ConversationController.setConversationHelper(conversationHelper);
                console.log('conversationService: initialzation complete');
            });

    },function(err){
        console.error('Conversation Controller: Unable to connect to bus: ' + err);
    });

    return app;
}();