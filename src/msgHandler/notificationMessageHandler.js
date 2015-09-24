/**
 * Created by randy on 1/27/14.
 */
var async                   = require('async');
var mongoose                = require('mongoose');
var model                   = require('../models/models');
var clientMap               = require('../util/clientMap');
var _                       = require('lodash');

var NotificationMessageHandler = module.exports = function NotificationMessageHandler() {
};


NotificationMessageHandler.prototype.onMessage = function ( msg, msgHandlerCallback ) {

    console.log('NotificationMessageHandler(): entered: handleMessage:' + JSON.stringify(msg));

    async.waterfall(
        [
            // send the notification
            function(callback) {
                var notification = JSON.parse(msg.content.toString());
                var recipientSocketIds = clientMap.getSocketList(notification.recipients);

                if (recipientSocketIds.length) {
                    for (var i=0; i < recipientSocketIds.length; i++) {
                        var socket = recipientSocketIds[i];

                        if (socket) {
                            socket.send(JSON.stringify(notification));
                            console.log('NotificationMessageHandler(): sent to profile: ');
                        }
                    }
                    callback(null,'done');
                } else {
                    console.log('NotificationMessageHandler(): no clients found: ');
                    callback(null,'done');
                }

            }
        ],

        function (err) {

            msgHandlerCallback(err, msg);
            console.log('NotificationMessageHandler(): exit: handleMessage');
        }
    );
};


