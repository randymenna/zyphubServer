/**
 * Created by randy on 1/27/14.
 */
var async                   = require("async");
var mongoose                = require('mongoose');
var model                   = require('../models/models');
var _                       = require('lodash');
var request                 = require('request');
var config                  = require('config');
var CONSTANTS               = require('../constants/index');

var WebHookMessageHandler = module.exports = function WebHookMessageHandler( options ) {

    this._options = options;

    this.setConversationHelper = function(conversationHelper) {
        this._conversationHelper = conversationHelper;
    };

    this.setNotificationHelper = function( notificationHelper ) {
        this._notificationHelper = notificationHelper;
    };
};


WebHookMessageHandler.prototype.handleMessagePool = function ( notification, msgHandlerCallback ) {
    var self = this;

    if (notification.enterprise !== self._options.enterprise){
        console.log("WebHookMessageHandler(): skipped: wrong enterprise",context);
        return;
    }
    console.log("WebHookMessageHandler(): entered: handleMessage:",notification);

    request.post(self._options.url, {
        headers: {
            'Content-Type': 'application/json'
        },
        json: true,
        body: notification
    }, function(err, response, tokens) {
        if(err) {
            console.log("WebHookMessageHandler(): error: ",err, tokens);
        } else {
            console.log("WebHookMessageHandler(): exit: handleMessage");
            msgHandlerCallback(null);
        }
    });
};


