/**
 * Created by randy on 1/30/14.
 */
var CONSTANTS   = require('../../constants/index');

var ExchangePublisherFactory = module.exports = function ExchangePublisherFactory(connection) {
    this._connection = connection;
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

    function assertDirectExchange(channel, exchangeName){
        channel.assertExchange(exchangeName+'Exchange', 'direct', exchangeOptions, function(err, ok) {
            if (err) {
                console.log(err);
                callback(null);
            } else {
                console.log(ok);
                var exchangePublisher = {
                    publish : function(routingKey, message) {
                        var route = this.exchange+routingKey;
                        return self._channel.publish(this.exchange+'Exchange', route, new Buffer(JSON.stringify(message)));
                    },
                    exchange: exchangeName
                };
                exchangePublisher.publish.bind(this);
                callback(exchangePublisher);
            }
        });
    }

    function on_channel_open(err, ch) {
        self._channel = ch;

        assertDirectExchange(ch, exchangeName);
    }

    if (!self._channel) {
        this._connection.createChannel(on_channel_open);
    } else {
        assertDirectExchange(self._channel, exchangeName);
    }

};

ExchangePublisherFactory.prototype.createFanoutExchangePublisher = function(exchangeName,callback) {
    var exchangeOptions = this.getExchangeOptions({});
    var self = this;

    function assertFanoutExchange(channel, exchangeName){
        channel.assertExchange(exchangeName+'Exchange', 'fanout', exchangeOptions, function(err, ok) {
            if (err) {
                console.log(err);
                callback(null);
            } else {
                console.log(ok);
                var exchangePublisher = {
                    publish : function(routingKey, message) {
                        return self._channel.publish(this.exchange+'Exchange', '', new Buffer(JSON.stringify(message)));
                    },
                    exchange: exchangeName
                };
                exchangePublisher.publish.bind(this);
                callback(exchangePublisher);
            }
        });
    }

    function on_channel_open(err, ch) {
        self._channel = ch;

        assertFanoutExchange(ch, exchangeName);
    }

    if (!self._channel) {
        this._connection.createChannel(on_channel_open);
    } else {
        assertFanoutExchange(self._channel, exchangeName);
    }

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