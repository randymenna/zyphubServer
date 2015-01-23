var async                           = require('async');
var MessageDrivenBean               = require('./util/mdb/messageDrivenBean');
var cpBus                           = require('./bus');
var ExchangePublisherFactory        = require('./util/bus/exchangePublisherFactory');
var config                          = require('config');
var mongoose                        = require('mongoose');
var AuditMessageHandler             = require('./msgHandler/auditMessageHandler');

var messageDrivenBean = null;

cpBus.connection.on('error',function(err) {
    logger.error("unable to connect to cp bus:" + err);
});

// INITIALIZATION CODE
// ONCE WE CAN CONNECT TO RABBIT MQ, TRY AND CONNECT TO MONGO, THEN START THE MDB
cpBus.connection.on('ready',function() {

    var exchangePublisherFactory = new exchangePublisherFactory(cpBus.connection);

    // INITIALIZATION CODE
    async.waterfall(
        [
            function(callback) {

                var context = {};

                console.info('Auditor MDB: mongoose connect');

                mongoose.connect(config.mongo.host, config.mongo.dbName, config.mongo.port, {auto_reconnect: true});

                callback(null,context);
            },

            function(context, callback) {

                console.info('Auditor MDB: handler create');

                var auditHandler = new auditMessageHandler();

                console.info('Auditor MDB: mdb bind');

                messageDrivenBean = new messageDrivenBean('AuditTrail',auditHandler);

                callback(null,'done');
            }
        ],
        function(err,result) {
            if (err) {
                console.error('Error Occurred while Initializing Auditor MDB' + err + result);
                throw err;
            } else {
                console.info('Auditor MDB Successfully Initialized');
            }
        }
    )
});
