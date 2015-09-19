var async                           = require('async');
var config                          = require('config');
var mongoose                        = require('mongoose');
var https                           = require('https');
var fs                              = require('fs');
var MessageDrivenBean               = require('../src/util/mdb/messageDrivenBean');
var cpBus                           = require('../src/bus');
var NotificationMessageHandler      = require('../src/msgHandler/notificationMessageHandler');
var AuthenticationHelper            = require('../src/util/authenticationHelper');
var ConversationHelper              = require('../src/rest/controllers/helper/conversationHelper');
var logger                          = require('../src/util/logger');
var CONSTANTS                       = require('../src/constants');
var RFC6455Server                   = require('../src/util/websocket/rfc6455Server');

logger.startLogger('notificationServer');

cpBus.promise.then(function() {

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


