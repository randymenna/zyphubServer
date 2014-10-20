/**
 * Created by randy on 1/15/14.
 */

var ObjectID = require('bson').BSONPure.ObjectID;

var genericMongoController  = require('./controllers/genericMongoController');

var cpbus                          = require('../bus');
var ExchangePublisherFactory         = require('../util/bus/ExchangePublisherFactory');
var EventPublisher                   = require('../util/bus/EventPublisher');

var exchangePublisherFactory = null;
var eventPublisher           = null;

module.exports = function(){
    var express = require('express');
    var app = express();

    app.get('/:collection'                  , genericMongoController.findAll);
    app.get('/:collection/:id'              , genericMongoController.findById);
    app.post('/:collection/:skip/:limit'    , genericMongoController.getSubset);
    app.get('/:collection/find/:query'      , genericMongoController.findByQuery);
    app.post('/:collection'                 , genericMongoController.addEntity);
    app.put('/:collection/:id'              , genericMongoController.updateEntity);
    app.delete('/:collection/:id'           , genericMongoController.deleteEntity);


    cpbus.connection.on('error',function(err) {
        console.error("MongoService: Unable to connect to cp bus:" + err);
    });

    cpbus.connection.on('ready',function() {

        console.log("MongoService: Connected to cp bus");
        exchangePublisherFactory = new ExchangePublisherFactory(cpbus.connection);

        exchangePublisherFactory.createConversationExchangePublisher(function(conversationEngineExchangePublisher) {
            eventPublisher = new EventPublisher( conversationEngineExchangePublisher );
        });
    });

    return app;
}();