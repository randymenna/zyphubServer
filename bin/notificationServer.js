/**
 * Created by randy
 */
var mongodbClient                           = require('./../mongodb-client/index');
var cpBus                                   = require('./../bus/index');
var async                                   = require('async');
var SocketIO                                = require('socket.io');
var jwt                                     = require('jwt-simple');
var https                                   = require('https');
var fs                                      = require('fs');
var config                                  = require('config');
var mongoose                                = require('mongoose');

var MessageDrivenBean                       = require('./../util/mdb/messageDrivenBean');
var NotificationMessageHandler              = require('./../msgHandler/notificationMessageHandler');
var ConversationHelper                      = require('./../rest/controllers/helper/conversationHelper');
var AuthenticationHelper                    = require('./../util/authenticationHelper');
var NotificationHelper                      = require('./../util/notificationHelper');
var RFC6455Server                           = require('./../util/websocket/rfc6455Server');
var logger                  = require('../util/logger');

logger.startLogger('notificationServer');

cpBus.connection.on('error',function(err) {
    console.log("unable to connect to cp bus:" + err);
});

cpBus.connection.on('ready',function() {

    var notificationHandler = new NotificationMessageHandler();
    notificationHandler.setConversationHelper( new ConversationHelper() );
    notificationHandler.setNotificationHelper( new NotificationHelper() );

    var rfc6455Server = new RFC6455Server();
    rfc6455Server.setAuthenticationProvider( new AuthenticationHelper() );

    if (config.socketio.isUnSecurePortEnabled) {
        rfc6455Server.startUnsecureServer();
    }
    else
    if (config.socketio.isSecurePortEnabled) {
        setupSecureServer();
    }

    messageDrivenBean = new MessageDrivenBean('CPNotification',notificationHandler, 1); // TODO: start is implicit in new
    console.log('NotificationMessageHandler Initialized');
});


