/**
 * Created by randy
 */
var mongodbClient                           = require('./mongodb-client');
var cpBus                                   = require('./bus');
var async                                   = require('async');
var SocketIO                                = require('socket.io');
var jwt                                     = require('jwt-simple');
var https                                   = require('https');
var fs                                      = require('fs');
var config                                  = require('config');
var mongoose                                = require('mongoose');

var MessageDrivenBean                       = require('./util/mdb/MessageDrivenBean');
var NotificationMessageHandler              = require('./msgHandler/NotificationMessageHandler');
var ConversationHelper                      = require('./rest/controllers/helper/conversationHelper');
var ClientMapHelper                         = require('./util/ClientMapHelper');
var AuthenticationHelper                    = require('./util/authenticationHelper');
var RFC6455Server                           = require('./util/websocket/rfc6455Server');

cpBus.connection.on('error',function(err) {
    console.log("unable to connect to cp bus:" + err);
});

cpBus.connection.on('ready',function() {

    var clientMapHelper = new ClientMapHelper();

    var notificationHandler = new NotificationMessageHandler();
    notificationHandler.setClientMapHelper( clientMapHelper );
    notificationHandler.setConversationHelper( new ConversationHelper() );

    var rfc6455Server = new RFC6455Server();
    rfc6455Server.setClientMapHelper( clientMapHelper );
    rfc6455Server.setAuthenticationProvider( new AuthenticationHelper() );

    if (config.socketio.isUnSecurePortEnabled) {
        rfc6455Server.startUnsecureServer();
    }
    else
    if (config.socketio.isSecurePortEnabled) {
        setupSecureServer();
    }

    messageDrivenBean = new MessageDrivenBean('NotificationServer',notificationHandler, 1);
    console.log('NotificationMessageHandler Initialized');
});

function setupServer() {


    var app = require('express')();
    var server = require('http').Server(app);
    var io = require('socket.io')(server);

    /*
    var app = require('http').createServer(handler)
    var io = require('socket.io')(app);
    var fs = require('fs');

    function handler (req, res) {
        fs.readFile(__dirname + '/index.html',
            function (err, data) {
                if (err) {
                    res.writeHead(500);
                    return res.end('Error loading index.html');
                }

                res.writeHead(200);
                res.end(data);
            });
    }
    */

    var WebSocketServer = require('ws').Server
        , wss = new WebSocketServer({ port: 19691 });

    wss.on('connection', function connection(ws) {
        ws.on('message', function incoming(message) {
            console.log('received: %s', message);
        });

        ws.send('something');
    });
/*
    server.listen(19691);
    console.log("listening");

    app.get('/', function (req, res) {
        res.sendfile(__dirname + '/index.html');
    });

    io.on('connection', function (socket) {
        //socket.emit('login', { login : 'bearer' });
        socket.on('login', function (data) {
            console.log(data);
            socket.emit('login', { login : 'ok' });
        });
    });
*/
    /*
    var serverSocket = SocketIO.listen(config.socketio.port);
    //serverSocket.set( 'origins', config.socketio.origin  );


    console.log("listening on %s " , config.socketio.port);

    serverSocket.sockets.on('connection', function (socket) {
        socket.on('login', function (data) {
            var decoded;

            console.log("login: " + data);
            try {
                decoded = jwt.decode(config.jwt.secret);

                console.log("login: " + JSON.stringify(decoded));

                notificationServerClientMapHelper.addClient(decoded,socket);
            }
            catch( e ) {
                console.log("Notification Server: login(): bad token");
            }
        });

        socket.on('disconnect', function (data) {
            console.log("Notification Server");
            notificationServerClientMapHelper.removeClient(socket.id);
        });
    });

    return serverSocket;
    */
}

function setupSecureServer() {

    var options = {
        key: fs.readFileSync(config.socketio.ssl.privateKeyFile),
        cert: fs.readFileSync(config.socketio.ssl.certificateFile),
        ca: fs.readFileSync(config.socketio.ssl.caCertsFile)
    };

    var secureServer = https.createServer(options, null);
    var secureServerSocket = SocketIO.listen(secureServer);
    secureServer.listen(config.socketio.securePort);
    secureServerSocket.set( 'origins', config.socketio.origin  );

    console.log("listening on %s " , config.socketio.securePort);

    secureServerSocket.sockets.on('connection', function (socket) {

        socket.on('login', function (data) {
            var decoded;

            console.log("login" + data);
            try {
                decoded = jwt.decode(data.userId, config.jwt.secret);

                console.log("login: " + JSON.stringify(decoded));

                notificationServerClientMapHelper.addClient(decoded,socket);
            }
            catch( e ) {
                console.log("socket.io-gateway: storeClientInfo: bad token");
            }
        });

        socket.on('disconnect', function (data) {
            console.log("socketIO-gateway: disconnect");
            notificationServerClientMapHelper.removeClient(socket.id);
        });
    });

    return secureServerSocket;

}

