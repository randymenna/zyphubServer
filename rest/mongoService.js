/**
 * Created by randy on 1/15/14.
 */

//var ObjectID                            = require('bson').BSONPure.ObjectID;
var passport                            = require('passport');
var genericMongoController              = require('./controllers/genericMongoController');
var cpbus                               = require('../bus');
//var ExchangePublisherFactory            = require('../util/bus/exchangePublisherFactory');

//var exchangePublisherFactory = null;
//var eventPublisher           = null;

module.exports = function(){
    var express = require('express');
    var app = express();

    app.get('/:collection'                  ,  passport.authenticate('bearer', { session: false }), genericMongoController.findAll);
    app.get('/:collection/:id'              ,  passport.authenticate('bearer', { session: false }), genericMongoController.findById);
    app.post('/:collection/:skip/:limit'    ,  passport.authenticate('bearer', { session: false }), genericMongoController.getSubset);
    app.get('/:collection/find/:query'      ,  passport.authenticate('bearer', { session: false }), genericMongoController.findByQuery);
    app.post('/:collection'                 ,  passport.authenticate('bearer', { session: false }), genericMongoController.addEntity);
    app.put('/:collection/:id'              ,  passport.authenticate('bearer', { session: false }), genericMongoController.updateEntity);
    app.delete('/:collection/:id'           ,  passport.authenticate('bearer', { session: false }), genericMongoController.deleteEntity);


    /*
    cpbus.connection.on('error',function(err) {
        console.error("MongoService: Unable to connect to cp bus:" + err);
    });
    */

    //cpbus.connection.on('ready',function() {
    cpbus.promise.then('ready',function() {

        console.log("MongoService: Connected to cp bus");
        //exchangePublisherFactory = new ExchangePublisherFactory(cpbus.connection);
    },function(err){
        console.error("MongoService: Unable to connect to cp bus:" + err);
    });

    return app;
}();