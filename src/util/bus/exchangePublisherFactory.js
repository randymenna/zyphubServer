/**
 * Created by randy on 1/30/14.
 */
var CONSTANTS   = require('../../constants/index');

var ExchangePublisherFactory = module.exports = function ExchangePublisherFactory(connection) {
    this._connection = connection;
    this._channelWrapper = null;
};

ExchangePublisherFactory.prototype.createConversationExchangePublisher = function(callback) {
    this.createDirectExchangePublisher(CONSTANTS.BUS.CONVERSATION_ROUTER,function(newPublisher) {
        callback(newPublisher);
    });
};

ExchangePublisherFactory.prototype.createSchedulerExchangePublisher = function(callback) {
    this.createDirectExchangePublisher(CONSTANTS.BUS.SCHEDULER,function(newPublisher) {
        callback(newPublisher);
    });

};

ExchangePublisherFactory.prototype.createNotificationExchangePublisher = function(callback) {
    this.createFanoutExchangePublisher(CONSTANTS.BUS.NOTIFIER,function(newPublisher) {
        callback(newPublisher);
    });

};

ExchangePublisherFactory.prototype.createAuditTrailExchangePublisher = function(callback) {
    this.createDirectExchangePublisher(CONSTANTS.BUS.AUDITTRAIL,function(newPublisher) {
        callback(newPublisher);
    });

};

ExchangePublisherFactory.prototype.createBillingExchangePublisher = function(callback) {
    this.createDirectExchangePublisher(CONSTANTS.BUS.BILLING,function(newPublisher) {
        callback(newPublisher);
    });

};

ExchangePublisherFactory.prototype.createDirectExchangePublisher = function(exchangeName,callback) {
    var exchangeOptions = this.getExchangeOptions({});
    var self = this;

    function on_channel_open(ch) {
        self._channel = ch;
        return self._channel.assertExchange(exchangeName+'Exchange', 'direct', exchangeOptions);
    }

    this._channelWrapper = this._connection.createChannel({setup: on_channel_open});
    var exchangePublisher = {
        publish : function(routingKey, message) {
            try {
                var route = this.exchange + routingKey;
                return self._channelWrapper.publish(this.exchange + 'Exchange', route, new Buffer(JSON.stringify(message)));
            } catch(e) {
                console.warn(e.stack);
                console.warn(e.stackAtStateChange);
            }
        },
        exchange: exchangeName
    };
    exchangePublisher.publish.bind(this);
    callback(exchangePublisher);
};

ExchangePublisherFactory.prototype.createFanoutExchangePublisher = function(exchangeName,callback) {
    var exchangeOptions = this.getExchangeOptions({});
    var self = this;

    function on_channel_open(ch) {
        self._channel = ch;
        return self._channel.assertExchange(exchangeName+'Exchange', 'fanout', exchangeOptions);
    }

    this._channelWrapper = this._connection.createChannel({setup: on_channel_open});
    var exchangePublisher = {
        publish : function(routingKey, message) {
            return self._channelWrapper.publish(this.exchange+'Exchange', '', new Buffer(JSON.stringify(message)));
        },
        exchange: exchangeName
    };
    exchangePublisher.publish.bind(this);
    callback(exchangePublisher);

};

ExchangePublisherFactory.prototype.getExchangeOptions = function(args) {
    return {
        passive: false,
        durable: true,
        confirm: true,
        autoDelete: false,
        arguments: args ? args : {}
    };
};