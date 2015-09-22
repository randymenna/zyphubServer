/**
 * Created by randy on 1/30/14.
 */
var CONSTANTS   = require('../../constants/index');

var ExchangePublisherFactory = module.exports = function ExchangePublisherFactory(connection) {
    this._connection = connection;
};

ExchangePublisherFactory.prototype.createConversationExchangePublisher = function(callback) {
    this.createExchangePublisher(CONSTANTS.BUS.CONVERSATION_ROUTER,function(newPublisher) {
        callback(newPublisher);
    });
};

ExchangePublisherFactory.prototype.createSchedulerExchangePublisher = function(callback) {
    this.createExchangePublisher(CONSTANTS.BUS.SCHEDULER,function(newPublisher) {
        callback(newPublisher);
    });

};

ExchangePublisherFactory.prototype.createNotificationExchangePublisher = function(callback) {
    this.createFanoutExchangePublisher(CONSTANTS.BUS.NOTIFIER,function(newPublisher) {
        callback(newPublisher);
    });

};

ExchangePublisherFactory.prototype.createAuditTrailExchangePublisher = function(callback) {
    this.createExchangePublisher(CONSTANTS.BUS.AUDITTRAIL,function(newPublisher) {
        callback(newPublisher);
    });

};

ExchangePublisherFactory.prototype.createBillingExchangePublisher = function(callback) {
    this.createExchangePublisher(CONSTANTS.BUS.BILLING,function(newPublisher) {
        callback(newPublisher);
    });

};

ExchangePublisherFactory.prototype.createExchangePublisher = function(exchangeName,callback) {
    var publishOptions  = this.getDefaultExchangeOptions();
    var exchangeOptions = this.getExchangeOptions({});
    var self = this;

    function assertExchange(channel, exchangeName){
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

        assertExchange(ch, exchangeName);
    }

    if (!self._channel) {
        this._connection.createChannel(on_channel_open);
    } else {
        assertExchange(self._channel, exchangeName);
    }

};

ExchangePublisherFactory.prototype.createFanoutExchangePublisher = function(exchangeName,callback) {

    var publishOptions  = this.getDefaultExchangeOptions();
    //publishOptions.type = 'fanout';

    var exchangeOptions = this.getExchangeOptions({});
    //exchangeOptions.type = 'fanout';
    var self = this;

    /*
    this._connection.exchange(exchangeName, exchangeOptions , function(exchange) {
        var newExchangePublisher = new MessageExchangePublisher(exchange,publishOptions);
        callback(newExchangePublisher);
    });
    */

    function on_channel_open(err, ch){
        self._channel = ch;

        var channelWithExchange = ch;
        ch.assertExchange(exchangeName+'Exchange', 'fanout', exchangeOptions, function(err, ok) {
            if (err) {
                console.log(err);
                callback(null);
            } else {
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

    if (!self._channel) {
        this._connection.createChannel(on_channel_open);
    } else {
        self._channel.assertExchange(exchangeName+'Exchange', 'fanout', exchangeOptions, function(err, ok) {
            if (err) {
                console.log(err);
                callback(null);
            } else {
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
};

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
};