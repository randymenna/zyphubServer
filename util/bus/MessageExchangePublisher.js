/**
 * Created by al
 */

var MessageExchangePublisher = module.exports = function MessageExchangePublisher(exchange,publishOptions) {
    this._exchange       = exchange;
    this._publishOptions = publishOptions;
};

MessageExchangePublisher.prototype.publish = function (routingKey, message, callback) {
    this._exchange.publish(routingKey, message, this._publishOptions, callback  );
}
