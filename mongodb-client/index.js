/**
 * Created by randy on 12/16/13.
 */
var config          = require('config');
var async           = require('async');
var mongo           = require('mongodb');
var cpConstants   = require('../constants');

module.exports.init = function (callback) {
    var Server  = mongo.Server;
    var Db      = mongo.Db;
    module.exports.BSON    = mongo.BSONPure;

    var server  = new Server(config.mongo.host, config.mongo.port, {auto_reconnect: true});
    var db      = new Db(config.mongo.dbName, server);

    db.open(function(err, db) {
        if(!err) {
            console.log("Connected to %s database", config.mongo.dbName);
            module.exports.dbclient = db;
        }
        else {
            console.log("FAILED to Connect to %s database",config.mongo.dbName);
        }
        callback(err);
    });
};

module.exports.get = function(id,collectionName,callback) {

    module.exports.dbclient.collection(collectionName, function(err, collection) {
        if (err) {
            console.log("get(): exiting " + collectionName + ' error occurred: ' + err);
            callback(err,null);
        } else {
            var objectId;

            if ( typeof id == 'string' )
                objectId = new module.exports.BSON.ObjectID(id);
            else
                objectId = id;

            collection.findOne( { _id : objectId }, function(err, item) {
                if (err) {
                    console.log("get(): " + collectionName + ' error occurred while calling findOne: ' + err);
                    callback(err,null);
                } else {
                    console.log("get(): found entity in " + collectionName + " with _id:  " + id);
                    callback(null,item);
                }
            });
        }
    });
}

module.exports.get2 = function(id,collectionName,getCallback) {

    var theCollection  = null;
    var entityToReturn = null;

    async.series(
        [
            function(callback) {
                module.exports.dbclient.collection(collectionName, function(err, collection) {
                    theCollection = collection;
                    callback(err,collection);
                });

            },
            function(callback) {
                var objectId;

                if ( typeof id == 'string' )
                    objectId = new module.exports.BSON.ObjectID(id);
                else
                    objectId = id;

                theCollection.findOne( { _id : objectId }, function(err, item) {
                    if (err) {
                        console.log("get(): " + collectionName + ' error occurred while calling findOne: ' + err);
                        callback(err,null);
                    } else {
                        console.log("get(): found entity in " + collectionName + " with _id:  " + id);
                        entityToReturn = item;
                        callback(null,item);
                    }
                });
            }
        ],
        function(err,result) {
            if (err) {
                console.log('get(): error occurred: ' + err + result);
            } else {
                console.log('get(): completed all steps');
            }
            getCallback(entityToReturn);
        }
    )
}


module.exports.findOne = function(query,collectionName,callback) {

    module.exports.dbclient.collection(collectionName, function(err, collection) {
        if (err) {
            console.log("findOne(): exiting " + collectionName + ' error occurred: ' + err);
            callback(err,null);
        } else {
            collection.findOne( query, function(err, item) {
                if (err) {
                    console.log("findOne(): " + collectionName + ' error occurred while calling findOne: ' + err);
                    callback(err,null);
                } else {
                    if (item != null) {
                        console.log("findOne(): found entity in " + collectionName + " with query:  " + JSON.stringify(query));
                        callback(null,item);
                    } else {
                        console.log("findOne(): entity NOT FOUND in " + collectionName + " with query:  " + JSON.stringify(query));
                        callback(null,null);
                    }
                }
            });
        }
    });
}

module.exports.insert = function(entities,collectionName,callback) {

    module.exports.dbclient.collection(collectionName, function(err, collection) {
            collection.insert(entities, {safe:true}, function(err, result) {
                if (err) {
                    console.log("insert(): unable to insert entities into " + collectionName + ' error occurred: ' + err);
                    callback(err,null);
                }
                else {
                    console.log('insert(): successfully inserted entities into: ' + collectionName + JSON.stringify(result));
                    callback(null,result);
                }
            });
    });
}


module.exports.updateOne = function(objectId, collectionName, theUpdate, callback) {
    module.exports.dbclient.collection(collectionName, function(err, collection) {
        var bsonObjectId = null;
        if ( typeof objectId == 'string' ) {
            console.log("updateOne(): converting id to bson for collection %s", collectionName);
            bsonObjectId = new module.exports.BSON.ObjectID(objectId);
        }
        else {
            bsonObjectId = objectId;
        }
        collection.update({ _id : bsonObjectId}, { $set: theUpdate }, { safe : true } , function(err, result) {
                if (err) {
                    console.log("updateOne(): unable to update entities in " + collectionName + ' error occurred: ' + err);
                    callback(err,null);
                }
                else {
                    console.log("updateOne(): successfully updated " + result + " entities in: " + collectionName);
                    callback(null,result);
                }
        });
    });
}

module.exports.update = function(query, collectionName, theUpdate, multi, callback) {
    module.exports.dbclient.collection(collectionName, function(err, collection) {
        collection.update(query, { $set: theUpdate }, { safe : true, multi: multi } , function(err, result) {
            if (err) {
                console.log("update(): unable to update entities in " + collectionName + ' error occurred: ' + err);
                callback(err,null);
            }
            else {
                console.log("update(): successfully updated " + result + " entities in: " + collectionName);
                callback(null,result);
            }
        });
    });
}

module.exports.unset = function(query, collectionName, unSet, callback) {
    module.exports.dbclient.collection(collectionName, function(err, collection) {
        collection.update(query, { $unset: unSet }, { safe : true } , function(err, result) {
            if (err) {
                console.log("unset(): unable to update entities in " + collectionName + ' error occurred: ' + err);
                callback(err,null);
            }
            else {
                console.log("unset(): successfully updated " + result + " entities in: " + collectionName);
                callback(null,result);
            }
        });
    });
}

module.exports.set = function(query, collectionName, toSet, callback) {
    module.exports.dbclient.collection(collectionName, function(err, collection) {
        collection.update(query, { $set: toSet }, { safe : true } , function(err, result) {
            if (err) {
                console.log("set(): unable to update entities in " + collectionName + ' error occurred: ' + err);
                callback(err,null);
            }
            else {
                console.log("set(): successfully updated " + result + " entities in: " + collectionName);
                callback(null,result);
            }
        });
    });
}


module.exports.remove = function( id, collectionName, callback ) {
    module.exports.dbclient.collection(collectionName, function(err, collection) {
        var objectId;

        if ( typeof id == 'string' )
            objectId = new BSON.ObjectID(id);
        else
            objectId = id;

        collection.remove({'_id':objectId}, {safe:true}, function(err, result) {
            if (err) {
                console.log("remove(): unable to remove entities in " + collectionName + ' error occurred: ' + err);
                callback(err,null);
            }
            else {
                console.log("remove(): successfully removed " + result + " entities in: " + collectionName);
                callback(null,result);
            }
        });
    });
};

module.exports.removeByQuery = function( query, collectionName, callback ) {
    module.exports.dbclient.collection(collectionName, function(err, collection) {
        var objectId;

        collection.remove(query, {safe:true}, function(err, result) {
            if (err) {
                console.log("removeByQuery(): unable to remove entities in " + collectionName + ' error occurred: ' + err);
                callback(err,null);
            }
            else {
                console.log("removeByQuery(): successfully removed " + result + " entities in: " + collectionName);
                callback(null,result);
            }
        });
    });
};

/**
 *
 * @param query
 * @param collectionName
 * @param projection
 * @param callback
 */
module.exports.find = function(query, collectionName, projection, callback) {
    module.exports.dbclient.collection(collectionName, function(err, collection) {
        if (err) {
            console.log("find(): exiting " + collectionName + ' error occurred: ' + err);
            callback(err,null);
        } else {
            collection.find(query,projection).toArray(function(err, items) {
                callback(err,items);
            });
        }
    });
};
