/**
 * Created by randy on 1/16/15.
 */
/**
 * Created by randy on 1/16/15.
 */
var io = require('socket.io-client');

//('http://localhost:19691');

var socketURL = 'http://localhost:19691';

var socket = io.connect('http://localhost:19691');

var p1 = 'hello';
socket.emit('login', p1, function(resp, data) {
    console.log('server sent resp code ' + resp);
});

var options ={
    transports: ['websocket'],
    'force new connection': true
};

var User1 = {'bearer':'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJwcm9maWxlIjoiYTQ3MDEzZGFjYWE3ZDIwMDAwZTU5MzA4IiwiaWF0IjoxNDIxNDI1MzYzfQ.C2dOhtpj31Wf10V0bBHA7wDLN9ROvrEXhdKipaDtRxU'};

socket.on('connect', function(){
    console.log('connect');
});

socket.on('login', function(data){
    console.log(data);
});

socket.on('disconnect', function(){});
