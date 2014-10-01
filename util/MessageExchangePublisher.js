/**
 * Created by al on 1/28/14.
 */

var MessageExchangePublisher = module.exports = function MessageExchangePublisher(exchange,publishOptions) {
    this._exchange       = exchange;
    this._publishOptions = publishOptions;
};

MessageExchangePublisher.prototype.publish = function (routingKey, message) {
    this._exchange.publish(routingKey, message, this._publishOptions  );
}

//{ type : 'direct' , contentType : 'application/json' }