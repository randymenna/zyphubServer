/**
 * Created by randy on 12/19/13.
 */
(function() {
    var ExchangePublisherFactory = require('../bus/exchangePublisherFactory');
    var q = require('q');
    var async = require('async');
    var CONSTANTS = require('../../constants/index');

    var epf = new ExchangePublisherFactory();

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
            channel.assertQueue(name, options, function (err, ok) {
                if (err) {
                    console.log(err);
                    callback(err, null);
                }
                else {
                    callback(null, ok.queue);
                }
            });
        };
    }

    function bindQueues(channel, exchange, queue, route) {
        return function (callback) {
            channel.bindQueue(queue, exchange, route, {}, function (err, ok) {
                if (err) {
                    console.log(err);
                    callback(err);
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
            channel.consume(queue, handler, {}, function (err, ok) {
                if (err) {
                    callback(err.null);
                }
                else {
                    callback(null, ok);
                }
            });
        };
    }

    function bindDirectExchangesAndQueues(bean, ch, done) {
        var DEAD_LETTER = {
            deadLetterExchange: bean.baseName + 'Exchange.dead',
            deadLetterRoutingKey: bean.baseName + 'Queue.dead'
        };

        async.waterfall([
                function (callback) {
                    ch.assertExchange(bean.baseName + 'Exchange', 'direct', epf.getExchangeOptions(), function (err, ok) {
                        if (err) {
                            console.log(err);
                            callback(err);
                        }
                        else {
                            callback();
                        }
                    });
                },

                function (callback) {
                    ch.assertExchange(bean.baseName + 'Exchange.dead', 'direct', epf.getExchangeOptions(), function (err, ok) {
                        if (err) {
                            console.log(err);
                            callback(err);
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
                    ch.assertQueue(bean.baseName + 'Queue.dead', {}, function (err, ok) {
                        if (err) {
                            console.log(err);
                            callback(err);
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
                    ch.bindQueue(bean.baseName + 'Queue.dead', bean.baseName + 'Exchange.dead', bean.baseName + 'Queue.dead', {}, function (err, ok) {
                        if (err) {
                            console.log(err);
                            callback(err);
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
                done(err);
            });
    }

    function bindFanoutExchangeAndQueues(bean, ch, done) {
        var DEAD_LETTER = {
            deadLetterExchange: bean.baseName + 'Exchange.dead',
            deadLetterRoutingKey: bean.baseName + 'Queue.dead',
            durable: false,
            exclusive: true
        };

        async.waterfall([
                function (callback) {
                    ch.assertExchange(bean.baseName + 'Exchange', 'fanout', epf.getExchangeOptions(), function (err, ok) {
                        if (err) {
                            console.log(err);
                            callback(err);
                        }
                        else {
                            callback();
                        }
                    });
                },

                function (callback) {
                    ch.assertExchange(bean.baseName + 'Exchange.dead', 'direct', epf.getExchangeOptions(), function (err, ok) {
                        if (err) {
                            console.log(err);
                            callback(err);
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
                    ch.assertQueue(bean.baseName + 'Queue.dead', {}, function (err, ok) {
                        if (err) {
                            console.log(err);
                            callback(err);
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
                    ch.bindQueue(bean.baseName + 'Queue.dead', bean.baseName + 'Exchange.dead', bean.baseName + 'Queue.dead', {}, function (err, ok) {
                        if (err) {
                            console.log(err);
                            callback(err);
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
                done(err, queues);
            });
    }

    function listenOnQueue(bean, ch, done) {
        var functions = [];
        for (var i = 0; i < bean.workers; i++) {
            functions.push((consumeQueue)(ch, bean.baseName + 'Queue' + i, bean.onMessageWrapper.bind(bean)));
        }

        if (functions.length) {
            async.parallel(functions, function (err, result) {
                done();
            });
        }
        else {
            done('No consumers');
        }
    }

    function listenOnFanQueues(bean, ch, queues, done) {
        var functions = [];
        for (var i = 0; i < queues.length; i++) {
            functions.push((consumeQueue)(ch, queues[i], bean.onMessageWrapper.bind(bean)));
        }

        if (functions.length) {
            async.parallel(functions, function (err, result) {
                done();
            });
        }
        else {
            done('No consumers');
        }
    }

    function messageDone(err, message) {
        var self = this;

        if (err) {
            if (message.fields.redelivered) {
                self.channel.nack(message, false, false);
                console.log('DLQ message');
            }
            else {
                self.channel.nack(message, false, true);
                console.log('Retry message');
            }
        }
        else {
            self.channel.ack(message);
        }
    }

    MessageDrivenBean.prototype.start = function (connection) {
        var deferred = q.defer();
        var self = this;

        if (connection){
            self.connection = connection;
        }

        function on_channel_open(err, ch) {
            if (err) {
                console.log(err);
                return;
            }
            self.channel = ch;

            if (self.type === CONSTANTS.BUS.DIRECT) {
                bindDirectExchangesAndQueues(self, ch, function (err) {
                    if (!err) {
                        listenOnQueue(self, ch, function (err) {
                            if (!err) {
                                console.log('mdb ' + self.baseName + ' started');
                            }
                        });
                    }
                });
            }
            else if (self.type === CONSTANTS.BUS.FANOUT) {
                bindFanoutExchangeAndQueues(self, ch, function (err, queues) {
                    if (!err) {
                        listenOnFanQueues(self, ch, queues, function (err) {
                            if (!err) {
                                console.log('mdb ' + self.baseName + ' started');
                            }
                        });
                    }
                });
            }
        }

        self.connection.createChannel(on_channel_open);

        return deferred.promise;
    };

    MessageDrivenBean.prototype.onMessageWrapper = function (message) {
        var self = this;

        self.messageHandler.onMessage(message, messageDone.bind(self));
    };
})();