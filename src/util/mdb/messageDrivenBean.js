/**
 * Created by randy on 12/19/13.
 */
(function() {
    var ExchangePublisherFactory = require('../bus/exchangePublisherFactory');
    var q = require('q');
    var async = require('async');
    var CONSTANTS = require('../../constants/index');

    var epf = new ExchangePublisherFactory();
    var fanoutQueues = [];
    var waitForFanQueues;

    var MessageDrivenBean = module.exports = function MessageDrivenBean(connection, type, baseName, messageHandler, workers) {
        this.baseName = baseName;
        this.messageHandler = messageHandler;
        this.workers = workers;
        this.connection = connection;
        this.type = type;
        this.channel = null;
    };

    function createQueues(channel, name, options) {
        return function (callback) {
            channel.assertQueue(name, options).then(function (ok) {
                if (!ok) {
                    callback('error', null);
                }
                else {
                    callback(null, ok.queue);
                }
            });
        };
    }

    function bindQueues(channel, exchange, queue, route) {
        return function (callback) {
            channel.bindQueue(queue, exchange, route, {}).then(function (ok) {
                if (!ok) {
                    callback('error', null);
                }
                else {
                    console.log(ok);
                    callback();
                }
            });
        };
    }

    function consumeQueue(channel, queue, handler) {
        return function (callback) {
            channel.prefetch(1);
            channel.consume(queue, handler, {}).then(function (ok) {
                if (!ok) {
                    callback('error', null);
                }
                else {
                    callback(null, ok);
                }
            });
        };
    }

    function bindDirectExchangesAndQueues(bean, ch) {
        var deferred = q.defer();

        var DEAD_LETTER = {
            deadLetterExchange: bean.baseName + 'Exchange.dead',
            deadLetterRoutingKey: bean.baseName + 'Queue.dead'
        };

        async.waterfall([
                function (callback) {
                    ch.assertExchange(bean.baseName + 'Exchange', 'direct', epf.getExchangeOptions()).then(function (ok) {
                        if (!ok) {
                            callback('error');
                        }
                        else {
                            callback();
                        }
                    });
                },

                function (callback) {
                    ch.assertExchange(bean.baseName + 'Exchange.dead', 'direct', epf.getExchangeOptions()).then(function (ok) {
                        if (!ok) {
                            callback('error');
                        }
                        else {
                            callback();
                        }
                    });
                },

                function (callback) {
                    var functions = [];
                    for (var i = 0; i < bean.workers; i++) {
                        functions.push((createQueues)(ch, bean.baseName + 'Queue' + i, DEAD_LETTER));
                    }
                    if (functions.length) {
                        async.parallel(functions, function (err, queues) {
                            callback(null, queues);
                        });
                    }
                    else {
                        callback('No Queues');
                    }
                },

                function (queues, callback) {
                    ch.assertQueue(bean.baseName + 'Queue.dead', {}).then(function (ok) {
                        if (!ok) {
                            callback('error');
                        }
                        else {
                            callback(null, queues);
                        }
                    });
                },

                function (queues, callback) {
                    var functions = [];
                    for (var i = 0; i < queues.length; i++) {
                        functions.push((bindQueues)(ch, bean.baseName + 'Exchange', queues[i], bean.baseName + i));
                    }
                    if (functions.length) {
                        async.parallel(functions, function () {
                            callback();
                        });
                    }
                    else {
                        callback('No bindings');
                    }
                },

                function (callback) {
                    ch.bindQueue(bean.baseName + 'Queue.dead', bean.baseName + 'Exchange.dead', bean.baseName + 'Queue.dead', {}).then(function (ok) {
                        if (!ok) {
                            callback('error');
                        }
                        else {
                            callback();
                        }
                    });
                }
            ],

            function (err) {
                if (err) {
                    console.log(err);
                }
                console.log('direct queues bound');
                deferred.resolve(err);
            });
        return deferred.promise;
    }

    function bindFanoutExchangeAndQueues(bean, ch) {
        var deferred = q.defer();

        var DEAD_LETTER = {
            deadLetterExchange: bean.baseName + 'Exchange.dead',
            deadLetterRoutingKey: bean.baseName + 'Queue.dead',
            durable: false,
            exclusive: true
        };

        async.waterfall([
                function (callback) {
                    ch.assertExchange(bean.baseName + 'Exchange', 'fanout', epf.getExchangeOptions()).then(function (ch) {
                        if (!ch) {
                            callback('error');
                        }
                        else {
                            callback();
                        }
                    });
                },

                function (callback) {
                    ch.assertExchange(bean.baseName + 'Exchange.dead', 'direct', epf.getExchangeOptions()).then(function (ch) {
                        if (!ch) {
                            callback('error');
                        }
                        else {
                            callback();
                        }
                    });
                },

                function (callback) {
                    var functions = [];
                    for (var i = 0; i < bean.workers; i++) {
                        functions.push((createQueues)(ch, '', DEAD_LETTER));
                    }
                    if (functions.length) {
                        async.parallel(functions, function (err, queues) {
                            callback(null, queues);
                        });
                    }
                    else {
                        callback('No Queues');
                    }
                },

                function (queues, callback) {
                    ch.assertQueue(bean.baseName + 'Queue.dead', {}).then(function (ch) {
                        if (!ch) {
                            callback('error');
                        }
                        else {
                            callback(null, queues);
                        }
                    });
                },

                function (queues, callback) {
                    var functions = [];
                    for (var i = 0; i < queues.length; i++) {
                        functions.push((bindQueues)(ch, bean.baseName + 'Exchange', queues[i], ''));
                    }
                    if (functions.length) {
                        async.parallel(functions, function () {
                            callback(null, queues);
                        });
                    }
                    else {
                        callback('No bindings');
                    }
                },

                function (queues, callback) {
                    ch.bindQueue(bean.baseName + 'Queue.dead', bean.baseName + 'Exchange.dead', bean.baseName + 'Queue.dead', {}).then( function (ch) {
                        if (!ch) {
                            callback('error');
                        }
                        else {
                            callback(null, queues);
                        }
                    });
                }
            ],

            function (err, queues) {
                if (err) {
                    console.log(err);
                }
                console.log('bound fanout queues');
                fanoutQueues = queues;
                waitForFanQueues.resolve(queues);
                deferred.resolve(err);
            });
        return deferred.promise;
    }

    function listenOnQueue(bean, ch) {
        var deferred = q.defer();

        var functions = [];
        for (var i = 0; i < bean.workers; i++) {
            functions.push((consumeQueue)(ch, bean.baseName + 'Queue' + i, bean.onMessageWrapper.bind(bean)));
        }

        if (functions.length) {
            async.parallel(functions, function () {
                deferred.resolve();
            });
        }
        else {
            deferred.reject();
        }
        return deferred.promise;
    }

    function listenOnFanQueues(bean, ch, queues) {
        var deferred = q.defer();

        var functions = [];
        waitForFanQueues.promise.then(function(queues){
            console.log('got fanout queues');
            for (var i = 0; i < queues.length; i++) {
                functions.push((consumeQueue)(ch, queues[i], bean.onMessageWrapper.bind(bean)));
            }

            if (functions.length) {
                async.parallel(functions, function () {
                    deferred.resolve();
                });
            }
            else {
                deferred.reject();
            }
        });

        return deferred.promise;
    }

    function messageDone(err, message) {
        var self = this;

        if (err) {
            if (message.fields.redelivered) {
                self.channelWrapper.nack(message, false, false);
                console.log('DLQ message');
            }
            else {
                self.channelWrapper.nack(message, false, true);
                console.log('Retry message');
            }
        }
        else {
            self.channelWrapper.ack(message);
        }
    }

    MessageDrivenBean.prototype.start = function (connection) {
        var self = this;

        if (connection){
            self.connection = connection;
        }

        function on_channel_open(ch) {

            self.channel = ch;

            if (self.type === CONSTANTS.BUS.DIRECT) {
                return q.all([
                    bindDirectExchangesAndQueues(self, ch),
                    listenOnQueue(self, ch)
                ]);
            }
            else if (self.type === CONSTANTS.BUS.FANOUT) {
                waitForFanQueues = q.defer();
                return q.all([
                    bindFanoutExchangeAndQueues(self, ch),
                    listenOnFanQueues(self, ch)
                ]);
            }
        }

        self.channelWrapper = self.connection.createChannel({setup:on_channel_open});
    };

    MessageDrivenBean.prototype.onMessageWrapper = function (message) {
        var self = this;

        self.messageHandler.onMessage(message, messageDone.bind(self));
    };
})();