var async                           = require('async');
var config                          = require('config');
var mongoose                        = require('mongoose');
var MessageDrivenBean               = require('../src/util/mdb/messageDrivenBean');
var cpBus                           = require('../src/bus');
var AuditMessageHandler             = require('../src/msgHandler/auditMessageHandler');
var ExchangePublisherFactory        = require('../src/util/bus/exchangePublisherFactory');
var logger                          = require('../src/util/logger');
var CONSTANTS                       = require('../src/constants');

logger.startLogger('auditEngine');


// INITIALIZATION CODE
// ONCE WE CAN CONNECT TO RABBIT MQ, TRY AND CONNECT TO MONGO, THEN START THE MDB
cpBus.promise.then(function(con){

    var exchangePublisherFactory = new ExchangePublisherFactory(cpBus.connection);

    // INITIALIZATION CODE
    async.waterfall(
        [
            function(callback) {

                var context = {};

                console.info('Auditor MDB: mongoose connect');

                mongoose.connect(config.mongo.url, {auto_reconnect: true},function(err){
                    if (err){
                        console.log('webhookServer(): mongoose error: ', err);
                        callback(err, null);
                    }
                    else {
                        console.log('webhookServer(): connected',config.mongo.url);
                        callback(null,context);
                    }
                });
            },

            function(context, callback) {

                console.info('Auditor MDB: handler create');

                var auditHandler = new AuditMessageHandler();

                try {
                    var messageDrivenBean = new MessageDrivenBean(cpBus.connection, CONSTANTS.BUS.DIRECT, CONSTANTS.BUS.AUDITTRAIL, auditHandler, CONSTANTS.BUS.AUDIT_WORKERS);
                    messageDrivenBean.start();
                } catch(exception){
                    console.log('Auditor: mdb.exception', exception);
                }

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
