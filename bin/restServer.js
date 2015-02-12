var express                 = require('express');
var bodyParser              = require('body-parser');
var url                     = require('url');
var mongoDbClient           = require('./../mongodb-client/index');
var https                   = require('https');
var config                  = require('config');
var fs                      = require('fs');
var mongoose                = require('mongoose');
var passport                = require('passport');

require('./../auth/passport')(passport);

mongoDbClient.init(function(error) {
    if ( error == null ) {
        var app = createExpressApplication();
        if (config.restServer.isUnSecurePortEnabled) {

            mongoose.connect(config.mongo.host, config.mongo.dbName, config.mongo.port, {auto_reconnect: true});
            runRestServer(app);
        }
        else
        if (config.restServer.isSecurePortEnabled) {
            runSecureRestServer(app);
        }
    }
    else {
        // TODO:
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
       console.info("HTTPS Server listening on " + config.restServer.securePort);
    });
}

function createExpressApplication() {

    var app = express();

    var checkContentType = function(req, res, next) {
        var requestType = req.get('Content-Type');
        if (req.method == 'POST' || req.method == 'PUT') {
            if (requestType == undefined) {
                res.status(415).json({error: 'Content-Type not defined'});
            } else if (requestType != "application/json") {
                res.status(415).json({error: 'Unsupported Content-Type ' + "'" + requestType + "'"});
            }
        }
        next();
    }

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
        if (oneof && req.method == 'OPTIONS') {
            res.send(200);
        }
        else {
            next();
        }
    }

    app.use(bodyParser.json())
        .use(bodyParser.urlencoded({extended:true}))
        .use(checkContentType)
        .use(allowCrossDomain)
        .use(passport.initialize());

    // IMPORTANT - this function must come before any routes
    //
    app.use(function(req, res, next) {
        // Put rest call preprocessing here.
        console.log("express interceptor");

        // ignore token validation
        if ( req.url.indexOf('/') == 0) {
            // no token to validate
            next();
        }
    });

    // the API Spec
    app.use("/apiDoc", express.static(__dirname + '/cp-api-swager.json'));
    // Routes

    app.use('/api', require('./../rest/mongoService'));
    app.use('/atrium/profiles', require('./../rest/profileService'));
    app.use('/atrium/groups', require('./../rest/groupService'));
    app.use('/atrium/conversations', require('./../rest/conversationService'));
    app.use('/atrium/escalations', require('./../rest/escalationService'));
    app.use('/atrium/auditTrail', require('./../rest/auditService'));
    app.use('/atrium/users', require('./../rest/userService'));
    app.use('/atrium/tags', require('./../rest/tagService'));
    app.use('/atrium/auth', require('./../rest/authService'));
    app.use('/auth', require('./../rest/authService'));

    return app;
}
