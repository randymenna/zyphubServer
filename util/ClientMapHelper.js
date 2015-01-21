/**
 * Created by
 */

var ClientMapHelper = module.exports = function ClientMapHelper() {
    this._clientMap = {};
}

ClientMapHelper.prototype.addClient = function(profileId,socket) {

    var clientInfo        = {};
    clientInfo.profileId     = profileId;
    clientInfo.socketId   = socket.id;
    clientInfo.socket     = socket;

    if (this._clientMap[profileId] == null) {
        this._clientMap[profileId] = [];
    }
    this._clientMap[ profileId ].push(clientInfo);
}

ClientMapHelper.prototype.removeClient = function(socket) {

    for( var key in this._clientMap ){

        var clientListForUser = this._clientMap[key];

        for (var i = 0; i < clientListForUser.length; i++) {
            var clientInfo = clientListForUser[i];
            if (clientInfo.socketId == socket.id) {
                clientListForUser.splice(i,1);
                if (clientListForUser.length == 0) {
                    delete this._clientMap[key];
                }
                break;
            }
        }
    }
}

ClientMapHelper.prototype.getSocketList = function(profileId) {
    return this._clientMap[ profileId ];
}
