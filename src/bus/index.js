
var amqp = require('amqplib/callback_api');
//var amqp    = require("amqp");
var config  = require("config");
var q       = require('q');

module.exports.publishMessage = function(queueName,payload,callback) {
    connection.publish(queueName,payload,{ type : 'direct' , contentType : 'application/json' },callback);
};

module.exports.createSubscriberWithCallback = function(queueName,onMsgCallback) {
    connection.queue(queueName, { passive : true, durable : true } ,function(q) {
        q.bind('amq.direct','#');
        q.subscribe(onMsgCallback);
    });
};

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
};

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
};

//var connection = amqp.createConnection( module.exports.getConnectionOptions());
//var connection = amqp.createConnection(config.cloudamqp.url);

var connection = null;
var deferred = q.defer();

function start() {
    amqp.connect(config.cloudamqp.url + "?heartbeat=60", function(err, conn) {
        if (err) {
            console.error("[AMQP]", err.message);
            deferred.reject(err.message);
            return setTimeout(start, 1000);
        }
        conn.on("error", function(err) {
            if (err.message !== "Connection closing") {
                console.error("[AMQP] conn error", err.message);
            }
        });
        conn.on("close", function() {
            console.error("[AMQP] reconnecting");
            return setTimeout(start, 1000);
        });

        console.log("[AMQP] connected");
        module.exports.connection = conn;

        deferred.resolve(conn);
    });
}

module.exports.promise = deferred.promise;
module.exports.connection=connection;

start();


// SAMPLE USAGE
// var cpbus = require('../cp-bus');
// cpbus.connection.on('ready',function() {
//   console.log('xxxxxConnected to cp Bus using amqp...');
//    cpbus.createSubscriberWithCallback('GatewayQueue',handleReceivedData);
// });
//
//cpbus.connection.on('error',function() {
//    console.log('error event fired for cpbus');
//});


