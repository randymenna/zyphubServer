/**
 * Created by randy on 11/18/14.
 */
var model                   = require('../../../models/models');
var mongoose                = require('mongoose');


exports.santize = function( group ) {

    delete group.__v;
    delete group.meta;
    delete group.name;
    delete group.public;
    delete group.type;
    delete group.avatar;

    return group;
}

exports.pull = function( array, item ) {
    for(var i = array.length-1; i--;){
        if (array[i] === item) array.splice(i, 1);
    }

    return array;
}

exports.pullAll = function( array, itemArray ) {
    for(var i = array.length-1; i--;){
        for (var j = 0; j < itemArray.length; j++)
            if (array[i] === itemArray[j]) array.splice(i, 1);
    }

    return array;
}