/**
 * Created by al on 1/8/14.
 */

var gibibus = require('../bus');

/**
 * Abstraction of sending a message to an AMQP Queue
 *
 */
var MessagePublisher = module.exports = function MessagePublisher(exchangeName) {
    this._exchange = null;
    var self = this;
    if (exchangeName != null) {
        gibibus.connection.exchange(exchangeName, getExchangeOptions(null) , function(exchange) {
            self._exchange = exchange;
        })
    }
};

MessagePublisher.prototype.publishToExchange = function (routingKey, message) {
    this._exchange.publish(routingKey, message, { type : 'direct' , contentType : 'application/json' } );
}

MessagePublisher.prototype.publishAsJSON = function (queueName, message, callback) {
    var messageAsJSON = JSON.stringify(message);
    gibibus.publishMessage(queueName,messageAsJSON,callback);
}

function getExchangeOptions(args) {
    return {
        type: 'direct',
        passive: false,
        durable: true,
        confirm: true,
        autoDelete: false,
        arguments: args ? args : {}
    };
};