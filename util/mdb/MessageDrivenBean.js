/**
 * Created by randy on 12/19/13.
 */
var config          = require('config');
var WorkerPool      = require('../pool/workerPool');

var MessageDrivenBean = module.exports = function MessageDrivenBean(baseName,messageHandler, instance) {
    this.baseName       = baseName;
    this.messageHandler = messageHandler;
    this.instance       = instance;
    this.workerPool     = new WorkerPool.WorkerPool(this.getWorkerPoolOptions());
    this.workerPool.start();
};

MessageDrivenBean.prototype.onMessage = function (message) {
    var self = this;
    try {
        console.log(this.baseName+".onMessage(): entered: message="+JSON.stringify(message));
        this.messageHandler.handleMessage(message);
    }
    catch (exception) {
        console.log(this.baseName+".onMessage(): caught exception");
        throw exception;
    } finally {
        console.log(this.baseName+".onMessage(): exiting");
    }
};

MessageDrivenBean.prototype.onMessagePool = function(msg, state, callback) {
    var payload       = msg.payload;
    var message       = msg.message;
    var deliveryInfo  = msg.deliveryInfo;

    var self = this;
    console.log(this.baseName+'.onMessage(): entered', 'message='+JSON.stringify(payload));

    try {
        self.messageHandler.handleMessagePool(payload, function(err) {
            self.notifyMessageBroker(err,message,deliveryInfo);
            callback(undefined, state);
            delete payload.notification;
            console.log(self.baseName+'.onMessage(): exiting', 'message='+JSON.stringify(payload));
        });
    } catch (exception) {
        console.log(self.baseName+'.onMessage():' , ' exception occurred: ' + exception);
        self.notifyMessageBroker(exception,message,deliveryInfo);
        callback(undefined, state);
    }
}

MessageDrivenBean.prototype.notifyMessageBroker = function (err, message,deliveryInfo) {
    var self = this;
    if (err == null) {
        console.log(self.baseName+'.onMessage():', 'acknowledging message');
        message.acknowledge(false);
    } else {
        if (deliveryInfo.redelivered) {
            console.log(self.baseName+'.onMessage():','dlqing message');
            message.reject(false);
        } else {
            console.log(self.baseName+'.onMessage():', 'requeueing message');
            message.reject(true);
        }
    }
}

MessageDrivenBean.prototype.getWorkerPoolOptions = function() {

    var self = this;

    var queueName = self.baseName;
    //if ( self.instance )
      //  queueName += self.instance;

    var workerPoolOptions = {
        name: self.baseName + 'Pool',
        debug: true,
        concurrency: 1,
        logger: console.log,
        mqOptions: {
            host: config.rabbitmq.host,
            login: config.rabbitmq.login,
            password: config.rabbitmq.password,
            authMechanism: config.rabbitmq.authMechanism,
            vhost: config.rabbitmq.vhost,
            reconnect: config.rabbitmq.reconnect,
            reconnectBackoffStrategy: config.rabbitmq.reconnectBackoffStrategy,
            reconnectExponentialLimit: config.rabbitmq.reconnectExponentialLimit,
            reconnectBackoffTime: config.rabbitmq.reconnectBackoffTime,
            exchangeName: self.baseName + 'Exchange',
            queueName:    queueName + 'Queue',
            routingKey:   self.baseName,
            retryTimeout: 20000
        },
        minionTaskHandler: function(msg,state,callback) {self.onMessagePool(msg,state,callback)},
        poolEnd: function() {
        }
    };
    return workerPoolOptions;
}
