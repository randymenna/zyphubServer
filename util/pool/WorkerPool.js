/**
 * Created by randy on 1/24/14.
 */

var RabbitMqMinionPool = require('rabbitmq_minionpool');
var util               = require('util');

function WorkerPool(options,messageHandler) {
    WorkerPool.super_.call(this, options);
}

util.inherits(WorkerPool, RabbitMqMinionPool.RabbitMqMinionPool);


/**
 * Overriding RabbitMqMinionPool.createRetryQueue to remove the behavior
 * of the DLQ automatically repopulating the work queue
 * @param connection
 * @param exchangeName
 * @param queueName
 * @param args
 * @param callback
 */
WorkerPool.prototype.createRetryQueue = function(
    connection, exchangeName, queueName, args, callback
    ) {
    var args = {};
    var name = this.retryNameFor(queueName);
    var self = this;

    this.createQueue(connection, name, args, this.retryNameFor(exchangeName), queueName, callback);
};

exports.WorkerPool = WorkerPool;