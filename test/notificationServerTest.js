/**
 * Created by randy on 1/16/15.
 */

var should = require('should');
var io = require('socket.io-client');

var socketURL = 'http://localhost:19691';

var options ={
    transports: ['websocket'],
    'force new connection': true
};

var User1 = {'bearer':'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJwcm9maWxlIjoiYTQ3MDEzZGFjYWE3ZDIwMDAwZTU5MzA4IiwiaWF0IjoxNDIxNDI1MzYzfQ.C2dOhtpj31Wf10V0bBHA7wDLN9ROvrEXhdKipaDtRxU'};


describe.only("Notification Server",function(){

    it('Should login a user', function(done){
        socket = io.connect("http://localhost:19691");

        socket.on('login',function(response) {
            console.log(response)
            response.should.equal('{login:"bearer"}');

            socket.emit('login',User1);
            socket.disconnect();
            done();
        });
    });

});
