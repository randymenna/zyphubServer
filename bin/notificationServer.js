var config                          = require('config');
var MessageDrivenBean               = require('../src/util/mdb/messageDrivenBean');
var CPBus                           = require('../src/bus');
var NotificationMessageHandler      = require('../src/msgHandler/notificationMessageHandler');
var AuthenticationHelper            = require('../src/util/authenticationHelper');
var ConversationHelper              = require('../src/rest/controllers/helper/conversationHelper');
//var NotificationHelper              = require('../src/rest/controllers/helper/notificationHelper');
var logger                          = require('../src/util/logger');
var RFC6455Server                   = require('../src/util/websocket/rfc6455Server');
var CONSTANTS                       = require('../src/constants');

logger.startLogger('notificationServer');

var cpBus = new CPBus();

cpBus.start().then(function (busConnection) {

    var notificationHandler = new NotificationMessageHandler();

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
        var messageDrivenBean = new MessageDrivenBean(busConnection, CONSTANTS.BUS.FANOUT, CONSTANTS.BUS.NOTIFIER, notificationHandler, CONSTANTS.BUS.NOTIFICATION_WORKERS);
        messageDrivenBean.start();
    } catch(exception){
        console.log('webhookRouter(): mdb.exception', exception);
    }
    console.log('NotificationMessageHandler Initialized');
});


