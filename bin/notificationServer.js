var config                          = require('config');
var MessageDrivenBean               = require('../src/util/mdb/messageDrivenBean');
var cpBus                           = require('../src/bus');
var NotificationMessageHandler      = require('../src/msgHandler/notificationMessageHandler');
var AuthenticationHelper            = require('../src/util/authenticationHelper');
var ConversationHelper              = require('../src/rest/controllers/helper/conversationHelper');
var NotificationHelper              = require('../src/rest/controllers/helper/notificationHelper');
var logger                          = require('../src/util/logger');
var RFC6455Server                   = require('../src/util/websocket/rfc6455Server');
var CONSTANTS                       = require('../src/constants');

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
        console.log('notificationServer(): no setupSecureServer() function');
    }

    try {
        var messageDrivenBean = new MessageDrivenBean(cpBus.connection, CONSTANTS.BUS.FANOUT, CONSTANTS.BUS.NOTIFIER, notificationHandler, 0);
        messageDrivenBean.start();
    } catch(exception){
        console.log('conversationRouter(): mdb.exception', exception);
    }
    console.log('NotificationMessageHandler Initialized');
});


