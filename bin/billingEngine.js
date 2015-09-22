var async                           = require('async');
var config                          = require('config');
var mongoose                        = require('mongoose');
var MessageDrivenBean               = require('../src/util/mdb/messageDrivenBean');
var cpBus                           = require('../src/bus');
var BillingMessageHandler           = require('../src/msgHandler/billingMessageHandler');
var logger                          = require('../src/util/logger');
var CONSTANTS                       = require('../src/constants');

logger.startLogger('billingEngine');


// INITIALIZATION CODE
// ONCE WE CAN CONNECT TO RABBIT MQ, TRY AND CONNECT TO MONGO, THEN START THE MDB
cpBus.promise.then(function(){

    // INITIALIZATION CODE
    async.waterfall(
        [
            function(callback) {

                var context = {};

                console.info('billingEngine MDB: mongoose connect');

                mongoose.connect(config.mongo.url, {auto_reconnect: true},function(err){
                    if (err){
                        console.log('billingEngine(): mongoose error: ', err);
                        callback(err, null);
                    }
                    else {
                        console.log('billingEngine(): connected',config.mongo.url);
                        callback(null,context);
                    }
                });
            },

            function(context, callback) {

                console.info('billingEngine MDB: handler create');

                var billingHandler = new BillingMessageHandler();

                try {
                    var messageDrivenBean = new MessageDrivenBean(cpBus.connection, CONSTANTS.BUS.DIRECT, CONSTANTS.BUS.BILLING, billingHandler, CONSTANTS.BUS.BILLING_WORKERS);
                    messageDrivenBean.start();
                } catch(exception){
                    console.log('billingEngine: mdb.exception', exception);
                }

                callback(null,'done');
            }
        ],
        function(err,result) {
            if (err) {
                console.error('Error Occurred while Initializing billingEngine MDB' + err + result);
                throw err;
            } else {
                console.info('billingEngine MDB Successfully Initialized');
            }
        }
    );
});
