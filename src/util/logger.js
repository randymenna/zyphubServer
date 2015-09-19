/**
 * Created by randy on 1/14/14.
 */
var winston         = require('winston');
var config          = require('config');
var moment          = require('moment');
var path            = require('path');
var fs              = require('fs');

var logger;
var log ;

var timeFormatFn = function() {
    'use strict';
    return moment().toISOString();
};

var dirName = path.join(__dirname,'..',config.logs.directory);

if (!fs.existsSync(dirName)){
    fs.mkdirSync(dirName);
}

module.exports.startLogger = function(serviceName) {
    var fileName = serviceName + '-';

    logger = new (winston.Logger)({
        exitOnError: false,
        transports: [
            new(winston.transports.DailyRotateFile)({
                filename: fileName,
                dirname: dirName,
                datePattern: 'MM-dd',
                timestamp: timeFormatFn,
                level: 'info',
                json: false
            }),
            new(winston.transports.Console)({
                colorize: true,
                timestamp: timeFormatFn,
                level: 'info',
                json: false
            })
        ]
    });

    logger.log('info','winston logging started');
    logger.log('debug','log directory',dirName);

    logger.extend(console);
    log = logger.log;


    console.log = function hijacked_log(level) {
        if (arguments.length > 1 && level in this) {
            log.apply(logger, arguments);
        } else {
            var args = Array.prototype.slice.call(arguments);
            args.unshift('info');
            log.apply(logger, args);
        }
    };

};