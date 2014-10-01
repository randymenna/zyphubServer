/**
 * Created by randy on 1/14/14.
 */
var log4js          = require('log4js');
var path            = require('path');
var fs              = require('fs-extra');
var config          = require('config');

var Logger = module.exports = function Logger() {
    return log4js.getLogger('gibi');
};

module.exports.getLogger = function(categoryName) {
    return log4js.getLogger(categoryName);
}