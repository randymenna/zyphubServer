/**
 * Created by randy on 1/30/14.
 */

var MessageExchangePublisher = require('./MessageExchangePublisher');

var CONVERSATION_EXCHANGE           = 'ConversationEngineExchange';
var SCHEDULER_EXCHANGE              = 'SchedulerExchange';
var NOTIFICATION_EXCHANGE           = 'NotificationExchange';
var AUDITTRAIL_EXCHANGE             = 'AuditTrailExchange';


var ExchangePublisherFactory = module.exports = function ExchangePublisherFactory(connection) {
    this._connection = connection;
}

/**
 * Creates an instance of MessageExchangePublisher that is bound to the POSITION_ANALYSIS_EXCHANGE
 * @param connection
 * @param callback
 */
ExchangePublisherFactory.prototype.createConversationExchangePublisher = function(callback) {
    this.createExchangePublisher(CONVERSATION_EXCHANGE,function(newPublisher) {
        callback(newPublisher);
    });
}

ExchangePublisherFactory.prototype.createSchedulerExchangePublisher = function(callback) {
    this.createExchangePublisher(SCHEDULER_EXCHANGE,function(newPublisher) {
        callback(newPublisher);
    });

}

ExchangePublisherFactory.prototype.createNotificationExchangePublisher = function(callback) {
    this.createFanOutExchangePublisher(NOTIFICATION_EXCHANGE,function(newPublisher) {
        callback(newPublisher);
    });

}

ExchangePublisherFactory.prototype.createAuditTrailExchangePublisher = function(callback) {
    this.createExchangePublisher(AUDITTRAIL_EXCHANGE,function(newPublisher) {
        callback(newPublisher);
    });

}


/**
 *
 * @param connection
 * @param exchangeName
 * @param callback , returns the created MessageExchangePublisher
 */
ExchangePublisherFactory.prototype.createExchangePublisher = function(exchangeName,callback) {

    var publishOptions  = this.getDefaultExchangeOptions();
    var exchangeOptions = this.getExchangeOptions({});

    this._connection.exchange(exchangeName, exchangeOptions , function(exchange) {
        var newExchangePublisher = new MessageExchangePublisher(exchange,publishOptions);
        callback(newExchangePublisher);
    });

}

ExchangePublisherFactory.prototype.createFanOutExchangePublisher = function(exchangeName,callback) {

    var publishOptions  = this.getDefaultExchangeOptions();
    var exchangeOptions = this.getExchangeOptions({});
    exchangeOptions.type = 'fanout';

    this._connection.exchange(exchangeName, exchangeOptions , function(exchange) {
        var newExchangePublisher = new MessageExchangePublisher(exchange,publishOptions);
        callback(newExchangePublisher);
    });

}


ExchangePublisherFactory.prototype.getExchangeOptions = function(args) {
    return {
        type:   'direct',
        passive: false,
        durable: true,
        confirm: true,
        autoDelete: false,
        arguments: args ? args : {}
    };
};

ExchangePublisherFactory.prototype.getDefaultExchangeOptions = function() {
    return {
        type : 'direct' ,
        contentType : 'application/json'
    };
}