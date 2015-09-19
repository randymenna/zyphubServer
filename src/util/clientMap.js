/**
 * Created by
 */

var _clientMap = {};

module.exports.addClient = function(profileId,socket) {

    var clientInfo        = {};
    clientInfo.profileId     = profileId;
    clientInfo.socketId   = socket.id;
    clientInfo.socket     = socket;

    if (_clientMap[profileId] == null) {
        _clientMap[profileId] = [];
    }
    _clientMap[ profileId ].push(clientInfo);
}

module.exports.removeClient = function(socket) {

    for( var key in _clientMap ){

        var clientListForUser = _clientMap[key];

        for (var i = 0; i < clientListForUser.length; i++) {
            var clientInfo = clientListForUser[i];
            if (clientInfo.socketId == socket.id) {
                clientListForUser.splice(i,1);
                /*
                if (clientListForUser.length == 0) {
                    delete _clientMap[key];
                }
                */
                break;
            }
        }
    }
}

module.exports.getSocketList = function(profiles) {
    var sockets = [];

    for (var i=0; i < profiles.length; i++) {

        var clients = _clientMap[ profiles[i] ];

        if ( clients ) {
            for (var j=0; j < clients.length; j++) {
                if ( clients[j].socket )
                    sockets.push( clients[j].socket );
            }
        }
    }

    return sockets;
}
