var express                 = require('express');
var bodyParser              = require('body-parser');
var https                   = require('https');
var config                  = require('config');
var fs                      = require('fs');
var mongoose                = require('mongoose');
var passport                = require('passport');
var logger                  = require('../src/util/logger');

logger.startLogger('restServer');

require('../src/auth/passport')(passport);
/*
mongoDbClient.init(function(error) {
    if ( error === null ) {
        var app = createExpressApplication();
        if (config.restServer.isUnSecurePortEnabled) {

            //mongoose.connect(config.mongo.host, config.mongo.dbName, config.mongo.port, {auto_reconnect: true});
            mongoose.connect(config.mongo.url, {auto_reconnect: true},function(err){
                if (err){
                    console.log('rest server(): mongoose error: ', err);
                }
                else {
                    console.log('restServer(): mongoose connected:',config.mongo.url);
                    runRestServer(app);
                }
            });
        }
        else
        if (config.restServer.isSecurePortEnabled) {
            runSecureRestServer(app);
        }
    }
    else {
        console.log(error);
    }
});
*/

mongoose.connect(config.mongo.url, {auto_reconnect: true},function(err){
    if (err){
        console.log('restServer(): mongoose error: ', err);
    }
    else {
        console.log('restServer(): mongoose.connect',config.mongo.url);
        var app = createExpressApplication();

        if (config.restServer.isUnSecurePortEnabled) {

            runRestServer(app);
        }
        else
        if (config.restServer.isSecurePortEnabled) {
            runSecureRestServer(app);
        }
    }
});

function runRestServer(app) {
    app.listen(config.restServer.port);
    console.info('Listening on :' + config.restServer.port);
}

function runSecureRestServer(app) {

    var privateKey = fs.readFileSync(config.restServer.ssl.privateKeyFile).toString();
    var certificate = fs.readFileSync(config.restServer.ssl.certificateFile).toString();
    var caCerts = fs.readFileSync(config.restServer.ssl.caCertsFile).toString();

    var options = {
      key : privateKey,
      cert : certificate,
      ca  : caCerts
    };

    var httpsServer = https.createServer(options,app);
    httpsServer.listen(config.restServer.securePort,function() {
       console.info('HTTPS Server listening on ' + config.restServer.securePort);
    });
}

function createExpressApplication() {

    var app = express();

    var checkContentType = function(req, res, next) {
        var requestType = req.get('Content-Type');
        if (req.method === 'POST' || req.method === 'PUT') {
            if (requestType === undefined) {
                res.status(415).json({error: 'Content-Type not defined'});
            } else if (requestType !== 'application/json') {
                res.status(415).json({error: 'Unsupported Content-Type ' + '"' + requestType + '"'});
            }
        }
        next();
    };

    var allowCrossDomain = function(req, res, next) {
        var oneof = false;
        if(req.headers.origin) {
            res.header('Access-Control-Allow-Origin', req.headers.origin);
            oneof = true;
        }
        if(req.headers['access-control-request-method']) {
            res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method']);
            oneof = true;
        }
        if(req.headers['access-control-request-headers']) {
            res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
            oneof = true;
        }
        if(oneof) {
            res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);
        }

        // intercept OPTIONS method
        if (oneof && req.method === 'OPTIONS') {
            res.sendStatus(200);
        }
        else {
            next();
        }
    };

    app.use(bodyParser.json())
        .use(bodyParser.urlencoded({extended:true}))
        .use(checkContentType)
        .use(allowCrossDomain)
        .use(passport.initialize());

    // IMPORTANT - this function must come before any routes
    //
    app.use(function(req, res, next) {
        // Put rest call preprocessing here.
        console.log(req.url);

        // ignore token validation
        if ( req.url.indexOf('/') === 0) {
            // no token to validate
            next();
        }
    });

    // the API Spec
    app.use('/apiDoc', express.static(__dirname + '/cp-api-swager.json'));
    // Routes

    app.use('/v1/profiles', require('../src/rest/profileService'));
    app.use('/v1/groups', require('../src/rest/groupService'));
    app.use('/v1/conversations', require('../src/rest/conversationService'));
    app.use('/v1/escalations', require('../src/rest/escalationService'));
    app.use('/v1/auditTrail', require('../src/rest/auditService'));
    app.use('/v1/users', require('../src/rest/userService'));
    app.use('/v1/contexts', require('../src/rest/contextService'));
    app.use('/v1/auth', require('../src/rest/authService'));
    app.use('/auth', require('../src/rest/authService'));
    app.use('/v1/webhook', require('../src/rest/webHookService'));
    app.use('/v1/admin', require('../src/rest/adminService'));

    return app;
}
