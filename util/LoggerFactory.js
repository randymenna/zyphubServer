/**
 * Created by al on 2/21/14.
 */

var log4js          = require('log4js');
var path            = require('path');
var fs              = require('fs-extra');
var config          = require('config');

var alreadyConfigured = false;

var LoggerFactory = module.exports = function LoggerFactory(logFileBaseName) {

    if (!alreadyConfigured && logFileBaseName != null)  {
        var logFileDir = path.resolve(__dirname, '..', '..', 'logs');
        fs.mkdirpSync(logFileDir);

        var category = logFileBaseName;
        var logFile = logFileDir + '/' + logFileBaseName + ".log";

        log4js.configure({
            appenders: [
                {
                    type        : 'console'
                },
                {
                    type        : "dateFile",
                    absolute    : true,
                    filename    : logFile,
                    pattern     : "-MM-dd-yy",
//                    category    : logFileBaseName,
                    alwaysIncludePattern: false
                },
                {
                    type: "dateFile",
                    absolute: true,
                    filename: logFile,
                    pattern: "-MM-dd-yy",
                    alwaysIncludePattern: false,
                    category: "cp"
                }
            ],
            replaceConsole: true

        });

        alreadyConfigured = true;
    }
};

LoggerFactory.prototype.getLogger = function(categoryName) {
    return log4js.getLogger(categoryName);
}