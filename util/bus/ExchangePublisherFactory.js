/**
 * Created by al on 1/30/14.
 */

var MessageExchangePublisher = require('../MessageExchangePublisher');

var POSITION_ANALYSIS_EXCHANGE  = 'PositionAnalysisExchange';
var DEVICE_REPORT_EXCHANGE      = 'DeviceReportExchange';
var NOTIFICATION_ENGINE_EXCHANGE = 'NotificationEngineExchange';
var EMAIL_EXCHANGE = 'OutboundEmailExchange';
var DEVICE_REPORT_ANALYSIS_EXCHANGE = 'DeviceReportAnalysisExchange';
//var SOCKETIO_NOTIFICATION_EXCHANGE = 'SocketIONotificationExchange';


var ExchangePublisherFactory = module.exports = function ExchangePublisherFactory(connection) {
    this._connection = connection;
}

/**
 * Creates an instance of MessageExchangePublisher that is bound to the POSITION_ANALYSIS_EXCHANGE
 * @param connection
 * @param callback
 */
ExchangePublisherFactory.prototype.createPositionAnalysisExchangePublisher = function(callback) {
    this.createExchangePublisher(POSITION_ANALYSIS_EXCHANGE,function(newPublisher) {
        callback(newPublisher);
    });}

ExchangePublisherFactory.prototype.createDeviceReportExchangePublisher = function(callback) {
    this.createExchangePublisher(DEVICE_REPORT_EXCHANGE,function(newPublisher) {
        callback(newPublisher);
    });
}

ExchangePublisherFactory.prototype.createDeviceReportAnalysisExchangePublisher = function(callback) {
    this.createExchangePublisher(DEVICE_REPORT_ANALYSIS_EXCHANGE,function(newPublisher) {
        callback(newPublisher);
    });
}

ExchangePublisherFactory.prototype.createNotificationEngineExchangePublisher = function(callback) {
    this.createExchangePublisher(NOTIFICATION_ENGINE_EXCHANGE,function(newPublisher) {
        callback(newPublisher);
    });

}

ExchangePublisherFactory.prototype.createEmailExchangePublisher = function(callback) {
    this.createExchangePublisher(EMAIL_EXCHANGE,function(newPublisher) {
        callback(newPublisher);
    });

}
/*
ExchangePublisherFactory.prototype.createSocketIONotificationExchangePublisher = function(callback) {
    this.createExchangePublisher(SOCKETIO_NOTIFICATION_EXCHANGE,function(newPublisher) {
        callback(newPublisher);
    });

}
*/

/**
 *
 * @param connection
 * @param exchangeName
 * @param callback , returns the created MessageExchangePublisher
 */
ExchangePublisherFactory.prototype.createExchangePublisher = function(exchangeName,callback) {

    var publishOptions  = this.getDefaultExchangeOptions();
    var exchangeOptions = this.getExchangeOptions({});

    this._connection.exchange(exchangeName, exchangeOptions , function(exchange) {
        var newExchangePublisher = new MessageExchangePublisher(exchange,publishOptions);
        callback(newExchangePublisher);
    });

}


ExchangePublisherFactory.prototype.getExchangeOptions = function(args) {
    return {
        type:   'direct',
        passive: false,
        durable: true,
        confirm: true,
        autoDelete: false,
        arguments: args ? args : {}
    };
};

ExchangePublisherFactory.prototype.getDefaultExchangeOptions = function() {
    return {
        type : 'direct' ,
        contentType : 'application/json'
    };
}