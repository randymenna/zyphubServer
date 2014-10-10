//TODO: unhardcode the url
var amqp    = require("amqp");
var config  = require("config");

module.exports.publishMessage = function(queueName,payload,callback) {
    connection.publish(queueName,payload,{ type : 'direct' , contentType : 'application/json' },callback);
}

module.exports.createSubscriberWithCallback = function(queueName,onMsgCallback) {
    connection.queue(queueName, { passive : true, durable : true } ,function(q) {
        q.bind('amq.direct','#');
        q.subscribe(onMsgCallback);
    });
}

module.exports.bindCallBackToQueue = function(queueName,onMsgCallback) {
    connection.queue(queueName, { passive : true, durable : true } ,function(q) {
        q.bind('amq.direct','#');

        q.subscribe({ack: false}, function(message) {
            onMsgCallback(message, function(err) {
                if (err != null) {
                    q.shift(true,true);
                } else {
                    q.shift();
                }
            });
        });
    });
}

module.exports.getConnectionOptions = function() {

    return  {
        host: config.rabbitmq.host,
        login: config.rabbitmq.login,
        password: config.rabbitmq.password,
        authMechanism: config.rabbitmq.authMechanism,
        vhost: config.rabbitmq.vhost,
        reconnect: config.rabbitmq.reconnect,
        reconnectBackoffStrategy: config.rabbitmq.reconnectBackoffStrategy,
        reconnectExponentialLimit: config.rabbitmq.reconnectExponentialLimit,
        reconnectBackoffTime: config.rabbitmq.reconnectBackoffTime,
        retryTimeout: 20000
    };
}

var connection = amqp.createConnection( module.exports.getConnectionOptions());

module.exports.connection=connection;


// SAMPLE USAGE
// var cpbus = require('../cp-bus');
// cpbus.connection.on('ready',function() {
//   console.log('xxxxxConnected to Gibi Bus using amqp...');
//    cpbus.createSubscriberWithCallback('PositionGatewayQueue',handleReceivedData);
// });
//
//cpbus.connection.on('error',function() {
//    console.log('error event fired for cpbus');
//});


