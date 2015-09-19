/**
 * Created by randy on 1/19/15.
 */
var shortId                             = require('shortid');
var clientMap                           = require('../clientMap');

var RFC6455Server = module.exports = function RFC6455Server( context ) {

    this.setAuthenticationProvider = function( authenticationProvider ) {
        this._authenticationProvider = authenticationProvider;
    };
};


RFC6455Server.prototype.startUnsecureServer = function () {
    var self = this;

    console.log('RFC6455Server.startServer(): unsecure');

    var WebSocketServer = require('ws').Server;
    var http = require('http');
    var express = require('express');
    var app = express();

    app.use(express.static(__dirname + '/public'));

    var server = http.createServer(app);
    server.listen(19691);

    var wss = new WebSocketServer({ server: server });

    wss.on('connection', function connection(ws) {

        console.log('connection');
        ws.send('login request');

        var token;

        ws.on('message', function(data) {

            if ( token = self._authenticationProvider.validateToken(data) ) {
                console.log('Notification server: %s', token.profileId);
                ws.id = shortId.generate();
                clientMap.addClient( token.profileId, ws );
            }
        });

        ws.on('close', function(data){
            clientMap.removeClient(ws);
        });

        ws.on('error', function(e){
            console.log('websocket error: ' + e);
            clientMap.removeClient(ws);
        });
    });
};

