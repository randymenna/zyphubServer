/**
 * Created by randy on 11/18/14.
 */
var model                   = require('../../../models/models');
var mongoose                = require('mongoose');
var moment                  = require('moment');


exports.newContext = function( context, callback ) {

    var t = new model.Context(context);

    return t;
};

exports.sanitize = function( context ) {


    function clean( t ) {

        delete t.__v;
        delete t.owner;

        return t;
    }

    if ( context instanceof Array )
        for(var i=0; i < context.length; i++ ) {
            context[i] = clean( context[i].toObject());
        }
    else
    if (context)
        context = clean(context.toObject());

    return context;
};

exports.getAll = function (context, callback) {
    model.Context.find(context.search).exec(function( err, ctxs){
        if ( err ) {
            callback(err, null);
        }
        else {
            context.ctx = exports.sanitize(ctxs);
            callback(null, context);
        }
    });
};

exports.getOne = function (context, callback) {
    model.Context.findOne(context.search).exec(function( err, ctx){
        if ( err ) {
            callback(err, null);
        }
        else {
            context.ctx = ctx ? exports.sanitize( ctx ) : null;
            callback(err, context);
        }
    });
};

exports.updateOne = function (context, callback) {
    model.Context.findOneAndUpdate(context.search,context.update).exec(function( err, ctx){
        if ( err ) {
            callback(err, null);
        }
        else {
            context.ctx = exports.sanitize( ctx );
            callback(null, context);
        }
    });
};

exports.removeAll = function (context, callback) {
    model.Context.remove(context.search).exec(function( err, ctx){
        if ( err ) {
            callback(err, null);
        }
        else {
            context.ctx =  { numRemoved: ctx };
            callback(null, context);
        }
    });
};

exports.removeOne = function (context, callback) {
    model.Context.findOneAndRemove(context.search).exec(function( err, ctx){
        if ( err ) {
            callback(err, null);
        }
        else {
            context.ctx = exports.sanitize( ctx );
            callback(null, context);
        }
    });
};