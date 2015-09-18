var async                           = require('async');
var MessageDrivenBean               = require('./../util/mdb/messageDrivenBean');
var cpBus                           = require('./../bus/index');
var ExchangePublisherFactory        = require('./../util/bus/exchangePublisherFactory');
var config                          = require('config');
var mongoose                        = require('mongoose');
var AuditMessageHandler             = require('./../msgHandler/auditMessageHandler');
var logger                          = require('../util/logger');
var CONSTANTS                       = require('../constants');

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

                //mongoose.connect(config.mongo.host, config.mongo.dbName, config.mongo.port, {auto_reconnect: true});
                mongoose.connect('mongodb://cpadmin:cpadmin@ds047802.mongolab.com:47802/cp', {auto_reconnect: true},function(err){
                    if (err){
                        console.log('webhookServer(): mongoose error: ', err);
                        callback(err, null);
                    }
                    else {
                        console.log('webhookServer(): mongoose.connect mongodb://cpadmin:cpadmin@ds047802.mongolab.com:47802/cp');
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
