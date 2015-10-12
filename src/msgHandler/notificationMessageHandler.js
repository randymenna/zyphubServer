/**
 * Created by randy on 1/27/14.
 */
var async                   = require('async');
var mongoose                = require('mongoose');
var model                   = require('../models/models');
var clientMap               = require('../util/clientMap');
var _                       = require('lodash');

function onlyUnique(value, index, self){
    return self.indexOf(value) === index;
}

var NotificationMessageHandler = module.exports = function NotificationMessageHandler() {
};


NotificationMessageHandler.prototype.onMessage = function ( msg, msgHandlerCallback ) {

    console.log('NotificationMessageHandler(): entered: handleMessage:' + JSON.stringify(msg));

    async.waterfall(
        [
            // send the notification
            function(callback) {
                var notification = JSON.parse(msg.content.toString());
                // TODO: find the root cause so we don't have to do this hack, why do the notification recipients have duplicates???
                var unique = notification.recipients.filter(onlyUnique);
                var recipients = clientMap.getSocketList(unique);

                // for each notification that is being sent, set the correct availableActions and tag it with the profileId of the intended recipient
                if (recipients.length) {
                    for (var i=0; i < recipients.length; i++) {
                        var recipient = recipients[i];

                        var note = JSON.parse(JSON.stringify(notification));
                        note.profileId = recipient.profileId;

                        if (note.envelope) {
                            if (note.envelope.origin === recipient.profileId) {
                                // origin
                                if (!note.header.allowableActions) {
                                    note.header.allowableActions = note.header.allowableActionsOrigin.slice();
                                    note.header.allowableActionsOrigin = undefined;
                                    note.header.allowableActionsParticipant = undefined;
                                }
                            }
                            else {
                                // participant
                                if (!note.header.allowableActions) {
                                    note.header.allowableActions = note.header.allowableActionsParticipant.slice();
                                    note.header.allowableActionsOrigin = undefined;
                                    note.header.allowableActionsParticipant = undefined;
                                }
                            }
                        }
                        recipient.socket.send(JSON.stringify(note));
                        console.log('NotificationMessageHandler(): sent to profile: ',recipient.profileId);
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


