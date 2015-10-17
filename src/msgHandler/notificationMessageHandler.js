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
                        note.intendedRecipient = recipient.profileId;

                      //if (!note.allowableActions) {
                            if (note.header.owner === note.intendedRecipient) {
                                // origin
                                note.allowableActions = note.allowableActionsOrigin.slice();
                            }
                            else {
                                // participant
                                note.allowableActions = note.allowableActionsParticipant.slice();
                            }
                       // }
                        if (note.terminateConversation) {
                            if (note.terminateConversation.indexOf(note.intendedRecipient) !== -1){
                                if (note.state) {
                                    note.state.open = false;
                                } else {
                                    note.state = {};
                                    note.state.open = false;
                                }
                            }
                        }

                        // clean up
                        note.header = undefined;
                        note.allowableActionsOrigin = undefined;
                        note.allowableActionsParticipant = undefined;
                        note.recipients = undefined;
                        note.terminateConversation = undefined;

                        recipient.socket.send(JSON.stringify(note));
                        console.log('NotificationMessageHandler(): sent to profile: ',note.type, note.intendedRecipient);
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


