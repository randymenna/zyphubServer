/**
 * Created by al on 9/4/14.
 */

var ConversationController           = require('./controllers/conversationController');

module.exports = function() {

    var express = require('express');
    var app = express();

    app.get('/', ConversationController.getConversations);
    app.post('/', ConversationController.newConversation);
    app.post('/:id/:action', ConversationController.updateConversation);

    return app;
}();