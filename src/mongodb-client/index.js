/**
 * Created by randy on 12/16/13.
 */
var config          = require('config');
var mongo           = require('mongodb');

module.exports.init = function (callback) {
    var Server  = mongo.Server;
    var Db      = mongo.Db;
    module.exports.BSON    = mongo.BSONPure;

    var server  = new Server(config.mongo.url, {auto_reconnect: true});
    var db      = new Db(config.mongo.dbName, server);

    db.open(function(err, db) {
        if(!err) {
            console.log('Connected to %s database', config.mongo.dbName);
            module.exports.dbclient = db;
        }
        else {
            console.log('FAILED to Connect to %s database',config.mongo.dbName);
        }
        callback(err);
    });
};