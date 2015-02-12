var async                           = require('async');
var MessageDrivenBean               = require('./../util/mdb/messageDrivenBean');
var cpBus                           = require('./../bus/index');
var ExchangePublisherFactory        = require('./../util/bus/exchangePublisherFactory');
var config                          = require('config');
var mongoose                        = require('mongoose');
var ScheduleHelper                  = require('./../util/scheduleHelper');
var Agenda                          = require('agenda');
var SchedulerMessageHandler         = require('./../msgHandler/schedulerMessageHandler');

var messageDrivenBean = null;

cpBus.connection.on('error',function(err) {
    console.log("unable to connect to cp bus:" + err);
});

// INITIALIZATION CODE
// ONCE WE CAN CONNECT TO RABBIT MQ, TRY AND CONNECT TO MONGO, THEN START THE MDB
cpBus.connection.on('ready',function() {

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

                mongoose.connect(config.mongo.host, config.mongo.dbName, config.mongo.port, {auto_reconnect: true});

                callback(null,context);
            },

            function(context, callback) {

                console.info('Scheduler MDB: schedule helper config');

                var scheduleHelper = new ScheduleHelper();

                var mongoInstance = config.mongo.host + ':' + config.mongo.port +'/' + config.mongo.agenda;
                var agenda = new Agenda({
                                        maxConcurrency: 100
                                        });

                agenda.database(mongoInstance,'conversePointJobs')

                agenda.define('handle escalation',scheduleHelper.handleEscalation);
                agenda.define('handle ttl',scheduleHelper.handleTTL);
                agenda.define('tag constraint',scheduleHelper.handleTagConstraint);

                var schedulerHandler = new SchedulerMessageHandler();
                schedulerHandler.setConversationPublisher(context.conversationPublisher);
                schedulerHandler.setAgenda(agenda);


                console.info('Scheduler MDB: mdb bind');

                messageDrivenBean = new MessageDrivenBean('Scheduler',schedulerHandler);

                console.info('Scheduler MDB: agenda start');

                var indexCallback = function(err) { if (err) { console.log("Index creation failed: " + err); } };

                agenda._db
                    .ensureIndex("nextRunAt", indexCallback)
                    .ensureIndex("lockedAt", indexCallback)
                    .ensureIndex("name", indexCallback)
                    .ensureIndex("priority", indexCallback);

                agenda.start();

                agenda.on('complete', function(job) {
                    console.log("Job %s finished", job.attrs.name);
                    job.remove(function(err) {
                        if(!err) console.log("Successfully removed job from collection");
                    })
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
    )
});
