/**
 * Created by randy on 1/16/14.
 */
var mongo       = require('mongodb');
var config      = require('config');

var MongoUtil = module.exports = function MongoUtil () {

    this.host   = config.mongo.host;
    this.port   = config.mongo.port;
    this.dbName = config.mongo.dbName;
    this.server = new mongo.Server(this.host, this.port, {auto_reconnect: true});
    this.db     = new mongo.Db(this.dbName, this.server);

    this.db.open(function(err, db) {
        if(!err) {
            console.log('MongoUtil: Connected to %s database', config.mongo.dbName);
        }
        else {
            console.log('MongoUtil: Unable to connect to %s database', config.mongo.dbName);
        }
    });
};

MongoUtil.prototype.getDb = function() {
    return this.db;
};
