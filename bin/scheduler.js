var async                           = require('async');
var config                          = require('config');
var mongoose                        = require('mongoose');
var Agenda                          = require('agenda');
var MessageDrivenBean               = require('../src/util/mdb/messageDrivenBean');
var cpBus                           = require('../src/bus');
var SchedulerMessageHandler         = require('../src/msgHandler/schedulerMessageHandler');
var ExchangePublisherFactory        = require('../src/util/bus/exchangePublisherFactory');
var ScheduleHelper                  = require('../src/util/scheduleHelper');
var logger                          = require('../src/util/logger');
var CONSTANTS                       = require('../src/constants');

logger.startLogger('scheduler');

// INITIALIZATION CODE
// ONCE WE CAN CONNECT TO RABBIT MQ, TRY AND CONNECT TO MONGO, THEN START THE MDB
cpBus.promise.then(function(){

    var exchangePublisherFactory = new ExchangePublisherFactory(cpBus.connection);

    // INITIALIZATION CODE
    async.waterfall(
        [
            function(callback) {

                var context = {};

                console.info('Scheduler MDB: create conversation publisher');

                exchangePublisherFactory.createConversationExchangePublisher(function(conversationPublisher) {
                    context.conversationPublisher = conversationPublisher;
                    callback(null,context);
                });
            },

            function(context, callback) {

                console.info('Scheduler MDB: mongoose connect');

                mongoose.connect(config.mongo.url, {auto_reconnect: true},function(err){
                    if (err){
                        console.log('scheduler(): mongoose error: ', err);
                        callback(err,null);
                    }
                    else {
                        console.log('scheduler(): mongoose.connect',config.mongo.url);
                        callback(null,context);
                    }
                });
            },

            function(context, callback) {

                console.info('Scheduler MDB: schedule helper config');

                var scheduleHelper = new ScheduleHelper();

                //var mongoInstance = config.mongo.host + ':' + config.mongo.port +'/' + config.mongo.agenda;
                var mongoInstance = config.mongo.url;

                    var agenda = new Agenda({
                                        maxConcurrency: 100
                                        });

                agenda.database(mongoInstance,'conversePointJobs');

                agenda.define('handle escalation',scheduleHelper.handleEscalation);
                agenda.define('handle ttl',scheduleHelper.handleTTL);
                agenda.define('tag constraint',scheduleHelper.handleTagConstraint);

                var schedulerHandler = new SchedulerMessageHandler();
                schedulerHandler.setConversationPublisher(context.conversationPublisher);
                schedulerHandler.setAgenda(agenda);


                try {
                    var messageDrivenBean = new MessageDrivenBean(cpBus.connection, CONSTANTS.BUS.DIRECT, CONSTANTS.BUS.SCHEDULER, schedulerHandler, CONSTANTS.BUS.SCHEDULE_WORKERS);
                    messageDrivenBean.start();
                } catch(exception){
                    console.log('Scheduler: mdb.exception', exception);
                }

                console.info('Scheduler MDB: agenda start');

                var indexCallback = function(err) { if (err) { console.log('Index creation failed: ' + err); } };

                agenda._db
                    .ensureIndex('nextRunAt', indexCallback)
                    .ensureIndex('lockedAt', indexCallback)
                    .ensureIndex('name', indexCallback)
                    .ensureIndex('priority', indexCallback);

                agenda.start();

                agenda.on('complete', function(job) {
                    console.log('Job %s finished', job.attrs.name);
                    job.remove(function(err) {
                        if(!err){
                            console.log('Successfully removed job from collection');
                        }
                    });
                });

                callback(null,'done');
            }
        ],
        function(err,result) {
            if (err) {
                console.error('Error Occurred while Initializing Scheduler MDB' + err + result);
                throw err;
            } else {
                console.info('Scheduler MDB Successfully Initialized');
            }
        }
    );
});
