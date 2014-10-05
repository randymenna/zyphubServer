/**
 * Created by randy on 10/4/14.
 */

var async       = require('async');
var request     = require('supertest');
var should      = require('should');

var ObjectID    = require('mongoose').ObjectID;
var url         = 'http://localhost:19690';
var assert      = require("assert");


describe('Conversation Tests', function() {

    before(function (done) {

        console.log("before");
        done();

    });

    describe('Leave Conversation', function () {

        // describe('Create then leave', function () {

        it('should leave 1 participant', function (done) {

            var context = {};
            context.newConv = buildConversationJSON();

            async.waterfall(
                [
                    function (callback) {
                        var context = {};
                        context.newConv = buildConversationJSON("STANDARD");
                        console.log(context.newConv);
                        callback(null, context);
                    },
                    function (context, callback) {
                        startConversation(context.newConv, function (err, result) {
                            context.conversation = result.body;
                            callback(null, context);
                        });
                    },
                    function (context, callback) {
                        conversationAction("leave", context.conversation, function (err, conv) {
                            context.conv = conv;
                            callback(null, context);
                        });
                    },
                    function (context, callback) {
                        context.conv.body.envelope.recipients.length.should.equal(1);

                        if (context.conv.body.envelope.recipients.length != 1) {
                            callback("Error: Leave Failed");
                        }
                        else {
                            callback(null, context);
                        }
                    }
                ],
                function (err, context) {
                    if (err) {
                        console.log('Error:' + err + context);
                    }
                    else {
                        console.log('entered the uber callback. Step ' + context + ' has completed');
                    }
                    done();
                }
            );

        });
        // });
    });

    describe('Accept Conversation', function () {

        // describe('Create then leave', function () {

        it('should leave 1 participant', function (done) {

            var context = {};
            context.newConv = buildConversationJSON();

            async.waterfall(
                [
                    function (callback) {
                        var context = {};
                        context.newConv = buildConversationJSON("FCFS");
                        console.log(context.newConv);
                        callback(null, context);
                    },
                    function (context, callback) {
                        startConversation(context.newConv, function (err, result) {
                            context.conversation = result.body;
                            callback(null, context);
                        });
                    },
                    function (context, callback) {
                        conversationAction("accept", context.conversation, function (err, conv) {
                            context.conv = conv;
                            callback(null, context);
                        });
                    },
                    function (context, callback) {
                        context.conv.body.envelope.recipients.length.should.equal(1);

                        if (context.conv.body.envelope.recipients.length != 1) {
                            callback("Error: Accept Failed");
                        }
                        else {
                            callback(null, context);
                        }
                    }
                ],
                function (err, context) {
                    if (err) {
                        console.log('here with error' + err + context);
                    }
                    else {
                        console.log('entered the uber callback. Step ' + context + ' has completed');
                    }
                    done();
                }
            );

        });
        // });
    });

    describe('Reject Conversation', function () {

        // describe('Create then leave', function () {

        it('should leave 1 participants', function (done) {

            var context = {};
            context.newConv = buildConversationJSON();

            async.waterfall(
                [
                    function (callback) {
                        var context = {};
                        context.newConv = buildConversationJSON("FCFS");
                        console.log(context.newConv);
                        callback(null, context);
                    },
                    function (context, callback) {
                        startConversation(context.newConv, function (err, result) {
                            context.conversation = result.body;
                            callback(null, context);
                        });
                    },
                    function (context, callback) {
                        conversationAction("reject", context.conversation, function (err, conv) {
                            context.conv = conv;
                            callback(null, context);
                        });
                    },
                    function (context, callback) {
                        context.conv.body.envelope.recipients.length.should.equal(1);

                        if (context.conv.body.envelope.recipients.length != 1) {
                            callback("Error: Reject Failed");
                        }
                        else {
                            callback(null, context);
                        }
                    }
                ],
                function (err, context) {
                    if (err) {
                        console.log('here with error' + err + context);
                    }
                    else {
                        console.log('entered the uber callback. Step ' + context + ' has completed');
                    }
                    done();
                }
            );

        });
        // });
    });

    describe('Ok Conversation', function () {

        // describe('Create then leave', function () {

        it('should leave 1 participants', function (done) {

            var context = {};
            context.newConv = buildConversationJSON();

            async.waterfall(
                [
                    function (callback) {
                        var context = {};
                        context.newConv = buildConversationJSON("FYI");
                        console.log(context.newConv);
                        callback(null, context);
                    },
                    function (context, callback) {
                        startConversation(context.newConv, function (err, result) {
                            context.conversation = result.body;
                            callback(null, context);
                        });
                    },
                    function (context, callback) {
                        conversationAction("ok", context.conversation, function (err, conv) {
                            context.conv = conv;
                            callback(null, context);
                        });
                    },
                    function (context, callback) {
                        context.conv.body.envelope.recipients.length.should.equal(1);

                        if (context.conv.body.envelope.recipients.length != 1) {
                            callback("Error: Ok Failed");
                        }
                        else {
                            callback(null, context);
                        }
                    }
                ],
                function (err, context) {
                    if (err) {
                        console.log('here with error' + err + context);
                    }
                    else {
                        console.log('entered the uber callback. Step ' + context + ' has completed');
                    }
                    done();
                }
            );

        });
        // });
    });

    describe('Close Conversation', function () {

        // describe('Create then leave', function () {

        it('should leave 0 participants', function (done) {

            var context = {};
            context.newConv = buildConversationJSON();

            async.waterfall(
                [
                    function (callback) {
                        var context = {};
                        context.newConv = buildConversationJSON("STANDARD");
                        console.log(context.newConv);
                        callback(null, context);
                    },
                    function (context, callback) {
                        startConversation(context.newConv, function (err, result) {
                            context.conversation = result.body;
                            callback(null, context);
                        });
                    },
                    function (context, callback) {
                        conversationAction("close", context.conversation, function (err, conv) {
                            context.conv = conv;
                            callback(null, context);
                        });
                    },
                    function (context, callback) {
                        context.conv.body.envelope.recipients.length.should.equal(0);

                        if (context.conv.body.envelope.recipients.length != 0) {
                            callback("Error: Close Failed");
                        }
                        else {
                            callback(null, context);
                        }
                    }
                ],
                function (err, context) {
                    if (err) {
                        console.log('here with error' + err + context);
                    }
                    else {
                        console.log('entered the uber callback. Step ' + context + ' has completed');
                    }
                    done();
                }
            );

        });
    });

    describe('Forward Conversation', function () {

        it('should leave 3 participants', function (done) {

            var context = {};
            context.newConv = buildConversationJSON();

            async.waterfall(
                [
                    function (callback) {
                        var context = {};
                        context.newConv = buildConversationJSON("STANDARD");
                        console.log(context.newConv);
                        callback(null, context);
                    },
                    function (context, callback) {
                        startConversation(context.newConv, function (err, result) {
                            context.conversation = result.body;
                            callback(null, context);
                        });
                    },
                    function (context, callback) {
                        conversationAction("forward", context.conversation, function (err, conv) {
                            context.conv = conv;
                            callback(null, context);
                        });
                    },
                    function (context, callback) {
                        context.conv.body.envelope.recipients.length.should.equal(3);

                        if (context.conv.body.envelope.recipients.length != 3) {
                            callback("Error: Forward Failed");
                        }
                        else {
                            callback(null, context);
                        }
                    }
                ],
                function (err, context) {
                    if (err) {
                        console.log('here with error' + err + context);
                    }
                    else {
                        console.log('entered the uber callback. Step ' + context + ' has completed');
                    }
                    done();
                }
            );

        });
    });

    describe('Delegate Conversation', function () {

        it('should leave 2 participants', function (done) {

            var context = {};
            context.newConv = buildConversationJSON();

            async.waterfall(
                [
                    function (callback) {
                        var context = {};
                        context.newConv = buildConversationJSON("STANDARD");
                        console.log(context.newConv);
                        callback(null, context);
                    },
                    function (context, callback) {
                        startConversation(context.newConv, function (err, result) {
                            context.conversation = result.body;
                            callback(null, context);
                        });
                    },
                    function (context, callback) {
                        conversationAction("delegate", context.conversation, function (err, conv) {
                            context.conv = conv;
                            callback(null, context);
                        });
                    },
                    function (context, callback) {
                        context.conv.body.envelope.recipients.length.should.equal(2);

                        if (context.conv.body.envelope.recipients.length != 2) {
                            callback("Error: Delegate Failed");
                        }
                        else {
                            callback(null, context);
                        }
                    }
                ],
                function (err, context) {
                    if (err) {
                        console.log('here with error' + err + context);
                    }
                    else {
                        console.log('entered the uber callback. Step ' + context + ' has completed');
                    }
                    done();
                }
            );

        });
    });

    describe('Escalate Conversation', function () {

        it('should leave 1 participants', function (done) {

            var context = {};
            context.newConv = buildConversationJSON();

            async.waterfall(
                [
                    function (callback) {
                        var context = {};
                        context.newConv = buildConversationJSON("STANDARD");
                        console.log(context.newConv);
                        callback(null, context);
                    },
                    function (context, callback) {
                        startConversation(context.newConv, function (err, result) {
                            context.conversation = result.body;
                            callback(null, context);
                        });
                    },
                    function (context, callback) {
                        conversationAction("escalate", context.conversation, function (err, conv) {
                            context.conv = conv;
                            callback(null, context);
                        });
                    },
                    function (context, callback) {
                        context.conv.body.envelope.recipients.length.should.equal(1);

                        if (context.conv.body.envelope.recipients.length != 1) {
                            callback("Error: Escalate Failed");
                        }
                        else {
                            callback(null, context);
                        }
                    }
                ],
                function (err, context) {
                    if (err) {
                        console.log('here with error' + err + context);
                    }
                    else {
                        console.log('entered the uber callback. Step ' + context + ' has completed');
                    }
                    done();
                }
            );

        });
    });


    function startConversation(payload, callback) {
        var c = payload;
        request(url)
            .post("/atrium/conversations")
            .send(c)
            // end handles the response
            .end(function (err, res) {
                if (err) {
                    throw err;
                }
                // this is should.js syntax, very clear
                res.status.should.equal(200);
                callback(null, res);
            });
    };

    function conversationAction(action, conversation, callback) {
        var payload = orginatorJSON(action);
        request(url)
            .post("/atrium/conversations/" + conversation._id + "/" + action)
            .send(payload)
            // end handles the response
            .end(function (err, res) {
                if (err) {
                    throw err;
                }
                // this is should.js syntax, very clear
                res.status.should.equal(200);
                callback(null, res);
            });
    };

    function buildConversationJSON(type) {
        var registration =
        {
            "envelope": {
                "originator": "54306b26717638000040a7e7",
                "recipients": [ "542e099f7c57130000d4128f", "54306ad3717638000040a7e6" ],
                "messageType": type
            },
            "time": {
                "ttl": 3600
            },
            "content": {
                "originalMessage": "This is a test of " + type + " message"
            }
        }

        return registration;
    };

    function orginatorJSON(action) {
        var o =
        {
            "originator": "54306ad3717638000040a7e6"
        };

        if (action) {
            if (action == "forward")
                o.forward = "54306b26717638000040a7e7";
            else if (action == "delegate")
                o.delegate = "54306b26717638000040a7e7";
            else if (action == "escalate") {
                o.escalate = [];
                o.escalate.push("54306b26717638000040a7e7");
            }
        }
        return o;
    };
})