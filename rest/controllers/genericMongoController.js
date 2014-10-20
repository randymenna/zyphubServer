var mongo       = require('mongodb');
var async       = require('async');
var config      = require('config');
var jwt         = require('jwt-simple');

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var collectionTriggers  = [];
var decorators          = [];


var server = new Server(config.mongo.host, config.mongo.port, {auto_reconnect: true});
var db = new Db(config.mongo.dbName, server);

db.open(function(err, db) {
    if(!err) {
        console.log("Connected to %s database",config.mongo.dbName);
    }
});

exports.addDecorator = function(collectionName,decorator) {
    var decoratorObj = {
        collectionName : collectionName,
        decorator      : decorator
    }
    decorators.push(decoratorObj);
}

exports.addTrigger = function(collectionName,methodName, triggerFunction) {
    var collectionTrigger = {
        collectionName          : collectionName,
        methodName              : methodName,
        triggerFunction         : triggerFunction
    }
    collectionTriggers.push(collectionTrigger);
}

exports.getSubset = function(req, res) {

    var query           = req.body.query;
    var sort            = req.body.sort

    //TODO: this is a hack, no doubt. I'm leaving it for now. Al said use the rule of 3

    // in history we need to search on deviceID & petID, and the petID needs to be BSON
    if ( query["petInfo.petId"] )
        query["petInfo.petId"] = new BSON.ObjectID(query["petInfo.petId"]);

    var collectionName = req.params.collection;
    var skip           = parseInt(req.params.skip);
    var limit          = parseInt(req.params.limit);
    var cpToken      = req.headers.cptoken;

    async.waterfall(
        [
            function(callback) {
                db.collection(collectionName, function(err, collection) {
                    callback(err,collection);
                });
            },
            function(collection,callback) {
                var accountId = exports.extractAccountId(req);
                callback(null,collection,accountId);
            },
            function(collection,accountId,callback) {

                query.accountId = accountId;
                collection.count(query,function(err, count) {
                    callback(err,collection,accountId,count);
                });
            },
            function(collection,accountId,count,callback) {

                collection.find(query).sort(sort).limit(limit).skip(skip).toArray(function(err, items) {
                    var bundle = {};
                    bundle.max = count;
                    bundle.items = items;
                    callback(err,bundle);
                });
            }
        ],
        function(err,data) {
            if (err)
            {
                console.log("getSubset(): exiting. " + collectionName + ' error occurred: ' + err);
                sendError(res,err);
            } else {
                //console.log('getSubset(): exiting. returning: ' + JSON.stringify(data));
                res.json(200,data);
            }
        }
    )

}

exports.findById = function(req, res) {

    var id             = req.params.id;
    var collectionName = req.params.collection;
    var cpToken      = req.headers.cptoken;

    console.log('findById(): entered. retrieving from ' + collectionName + 'with id: ' + id);

    async.waterfall(
        [
            function(callback) {
                db.collection(collectionName, function(err, collection) {
                    callback(err,collection);
                });
            },
            function(collection,callback) {
                var accountId = exports.extractAccountId(req);
                callback(null,collection,accountId);
            },
            function(collection,accountId,callback) {
                collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, itemInDB) {
                    callback(err,accountId,itemInDB);
                })
            },
            function(accountId,itemInDB,callback) {
                if (itemInDB == null || !itemInDB.accountId.equals(accountId)) {
                    callback(createNotFoundError(),null);
                } else {
                    callback(null,itemInDB);
                }
            }
        ],
        function(err,itemInDB) {
            if (err)
            {
                console.log("findById(): exiting. " + collectionName + ' error occurred: ' + err);
                sendError(res,err);
            } else {
                delete itemInDB.accountId;
                console.log('findById(): exiting. returning: ' + JSON.stringify(itemInDB));
                res.json(200,itemInDB);
            }
        }
    )
};

exports.findAll = function(req, res) {

    var collectionName = req.params.collection;
    var cpToken      = req.headers.cptoken;

    async.waterfall(
        [
            function(callback) {
                db.collection(collectionName, function(err, collection) {
                    callback(err,collection);
                });
            },
            function(collection,callback) {
                var accountId = exports.extractAccountId(req);
                callback(null,collection,accountId);
            },
            function(collection,accountId,callback) {
                var queryCriteria = {};
                if (accountId != null) {
                    queryCriteria.accountId = accountId;
                }
                collection.find(queryCriteria).toArray(function(err, items) {
                    callback(err,items);
                });
            }
        ],
        function(err,items) {
            if (err) {
                console.log('findAll(): error occurred: ' + err + result);
                sendError(res,err);
            } else {
                console.log('findAll(): returning ' + items.length);
                for (var i=0;i<items.length;i++) {
                    delete items[i].accountId;
                }
                res.json(200,items);
            }
        }
    )
};

exports.findByQuery = function(req, res) {

    var collectionName = req.params.collection;
    var queryCriteria  = req.params.query;
    var cpToken      = req.headers.cptoken;

    console.log('findByQuery(): entered. retrieving from ' + collectionName + 'with query: ' + queryCriteria);

    async.waterfall(
        [
            function(callback) {
                db.collection(collectionName, function(err, collection) {
                    callback(err,collection);
                });
            },
            function(collection,callback) {
                var accountId = exports.extractAccountId(req);
                callback(null,collection,accountId);
            },
            function(collection,accountId,callback) {
                collection.find(queryCriteria).toArray(function(err, items) {
                    callback(err,items);
                });
            }
        ],
        function(err,items) {
            if (err) {
                console.log('findByQuery(): error occurred: ' + err + result);
                sendError(res,err);
            } else {
                console.log('findByQuery(): returning ' + items.length);
                for (var i=0;i<items.length;i++) {
                    delete items[i].accountId;
                }
                res.json(200,items);
            }
        }
    )
};

exports.addEntity = function(req, res) {


    var collectionName = req.params.collection;
    var cpToken      = req.headers.cptoken;
    var entity         = req.body;

    console.log('addEntity(): entered. adding entity to ' + collectionName + ": " + JSON.stringify(entity));


    async.waterfall(
        [
            function(callback) {
                db.collection(collectionName, function(err, collection) {
                    callback(err,collection);
                });
            },
            function(collection,callback) {
                var accountId = exports.extractAccountId(req);
                callback(null,collection,accountId);
            },
            function(collection,accountId,callback) {
                if (entity._id != null) {
                    try {
                        entity._id = new BSON.ObjectID(entity._id);
                        callback(null,collection,accountId);
                    } catch (exception) {
                        exception.number = 400;  // bad request
                        callback(exception,null);
                    }
                } else {
                    callback(null,collection,accountId);
                }
            },
            function(collection,accountId,callback) {
                for (var i=0;i<decorators.length;i++) {
                    if (decorators[i].collectionName == collectionName) {
                        console.log("addEntity(): decorating entity for collection: " + collectionName);
                        entity = decorators[i].decorator.decorateBeforeInsert(entity);
                        break;
                    }
                }
                callback(null,collection,accountId);
            },
            function(collection,accountId,callback) {
                 entity.accountId = accountId;
                 collection.insert(entity, {safe:true}, function(err, result) {
                        callback(err,result);
                 })
            }
        ],
        function(err,result) {
            if (err)
            {
                console.log("addEntity(): exiting. " + collectionName + ' error occurred: ' + err);
                sendError(res,err);
            } else {
                delete result[0].accountId;
                console.log('addEntity(): exiting. returning: ' + JSON.stringify(result[0]));
                res.json(201,result[0]);
            }
        }
    )
}

exports.updateEntity = function(req, res) {

    var id = req.params.id;
    var collectionName = req.params.collection;
    var entityToUpdate = req.body;

    entityToUpdate._id = new BSON.ObjectID(id);

    console.log('updatingEntity(): entered. updating entity in ' + collectionName + ": " + JSON.stringify(entityToUpdate));

    async.waterfall(
        [
            function(callback) {
                db.collection(collectionName, function(err, collection) {
                    callback(err,collection);
                });
            },
            function(collection,callback) {
                var accountId = exports.extractAccountId(req);
                callback(null,collection,accountId);
            },
            function(collection,accountId,callback) {
                collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, itemInDB) {
                    callback(err,collection,accountId,itemInDB);
                });
            },
            function(collection,accountId,itemInDB,callback) {
                if (!itemInDB.accountId.equals(accountId)) {
                    callback(createNotFoundError(),null);
                } else {
                    delete entityToUpdate._id;
                    entityToUpdate.accountId = accountId;
                    collection.update({'_id':new BSON.ObjectID(id)}, { $set :entityToUpdate }, {safe:true}, function(err, result) {
                        callback(err,collection,entityToUpdate,itemInDB);
                    });
                }
            },
            function(collection,entityToUpdate,originalItem,callback) {
                collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, updatedItem) {
                    callback(err,originalItem,updatedItem,entityToUpdate);
                });
            },
            function(originalItem, updatedItem, entityToUpdate, callback) {

                var currentMethod    = "updateEntity";
                var context          = {};
                context.originalItem = originalItem;
                context.updatedItem  = updatedItem;
                context.entityToUpdate = entityToUpdate;

                for (var i=0;i<collectionTriggers.length;i++) {
                    if (collectionTriggers[i].methodName == currentMethod
                        && collectionTriggers[i].collectionName == collectionName) {
                       var triggerFunction = collectionTriggers[i].triggerFunction;
                        console.log("about to call triggerFunction");
                       triggerFunction(context);
                    }
                }
                callback(null,updatedItem);

            }
        ],
        function(err,result) {
            if (err) {
                console.log("updateEntity(): exiting. " + collectionName + ' error occurred while updating document with id: ' + id + ': ' + err);
                sendError(res,err);
            } else {
                console.log('updateEntity(): exiting. returning: ' + JSON.stringify(entityToUpdate));
                if ( result != null )
                    delete result.accountId;
                res.json(200,result);
            }
        }
    )
}

exports.deleteEntity = function(req, res) {
    var id = req.params.id;
    var collectionName = req.params.collection;

    console.log('deleteEntity(): entered. deleting from ' + collectionName + ' with id: ' + id);

    async.waterfall(
        [
            function(callback) {
                db.collection(collectionName, function(err, collection) {
                    callback(err,collection);
                });
            },
            function(collection,callback) {
                var accountId = exports.extractAccountId(req);
                callback(null,collection,accountId);
            },
            function(collection,accountId,callback) {

                collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, itemInDB) {
                    if ( !itemInDB )
                        callback("itemInDB not Found", null);
                    else
                        callback(err,collection,accountId,itemInDB);
                });
            },
            function(collection,accountId,itemInDB,callback) {
                if (!itemInDB.accountId.equals(accountId)) {
                    callback(createNotFoundError(),null);
                } else {
                    collection.remove({'_id':new BSON.ObjectID(id)}, {safe:true}, function(err, result) {
                        callback(err,result,itemInDB);
                    });
                }
            },
            function(result, originalItem, callback) {

                var currentMethod    = "deleteEntity";
                var context          = {};
                context.originalItem = originalItem;

                for (var i=0;i<collectionTriggers.length;i++) {
                    if (collectionTriggers[i].methodName == currentMethod
                        && collectionTriggers[i].collectionName == collectionName) {
                        var triggerFunction = collectionTriggers[i].triggerFunction;
                        console.log("about to call triggerFunction");
                        triggerFunction(context);
                    }
                }
                callback(null,result);

            }
        ],
        function(err,result) {
            if (err) {
                console.log("deleteEntity(): exiting. " + collectionName + ' error occurred: ' + err);
                sendError(res,err);
            } else {
                console.log("deleteEntity(): exiting. " + result + ' document(s) deleted with id:' + id);
                res.send();
            }
        }
    )
}

exports.extractAccountId = function(req) {
    var cpToken      = req.headers.cptoken;
    var accountId      = null;
    if (cpToken != null) {
        var decodedToken   = jwt.decode(cpToken, config.jwt.secret);
        var accountId      = decodedToken.accountId;
    }
    if ( accountId == null )
        return null;
    else
        return new BSON.ObjectID(accountId);
}

function sendError(res,err) {
    if ( err.number != null && err.number != 0) {
        res.json(err.number, {error : err.message});
    } else {
        res.json(500, {error : err.message});
    }
}

function createNotFoundError() {
    var err = new Error();
    err.message = "Not Found";
    err.number = 404;
    return err;
}