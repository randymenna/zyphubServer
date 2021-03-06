
//var amqp = require('amqplib/callback_api');
var amqp = require('amqp-connection-manager');
var config  = require('config');
var q       = require('q');

var connection = null;
var reconnect = false;

var _beanRestartFn = null;
var _connection = null;

var CPBus = module.exports = function cpBus() {


    this.setBeanRestart = function(beanRestartFn) {
        _beanRestartFn = beanRestartFn;
    };
};

CPBus.prototype.amqpReconnectConnect = function() {

    console.log('*** AMQP Restart');
    CPBus.prototype.start();
};

CPBus.prototype.getConnection = function() {
    return _connection;
};

var deferred = q.defer();

CPBus.prototype.start = function () {
    var self = this;

    console.log('CPBus.start() entered');

    /*
    amqp.connect(config.cloudamqp.url + '?heartbeat=25&frameMax=0x1000', function(err, conn) {

        if (err) {
            console.error('[AMQP]', err.message);
            return setTimeout(self.amqpReconnectConnect, 1000);
        }
        _connection = conn;

        conn.on('error', function(err) {
            if (err.message !== 'Connection closing') {
                console.error('[AMQP] conn error', err.message);
            }
        });

        conn.on('close', function() {
            console.error('[AMQP] reconnecting');
            reconnect = true;
            return setTimeout(self.amqpReconnectConnect, 1000);
        });

        console.log('[AMQP] connected');

        if (reconnect){
            reconnect = false;

            if (_beanRestartFn) {
                console.log('bean restart');
                _beanRestartFn(conn);
            } else {
                console.log('no bean to restart');
            }
        }

        deferred.resolve(conn);
    });
    */
    _connection = amqp.connect(config.cloudamqp.url + '?frameMax=0x1000',{json:true, heartbeatIntervalInSeconds: 60});
    _connection.on('connect', function() {
        console.log('Connected!');
        deferred.resolve(_connection);
    });
    _connection.on('disconnect', function(params) {
        console.log('Disconnected.', params.err.stack);
    });


    return deferred.promise;
};




