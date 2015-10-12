/**
 * Created by randy on 9/19/15.
 */

var EnterpriseController            = require('./controllers/enterpriseController');
var passport                        = require('passport');


module.exports = function() {

    var express = require('express');
    var app = express();

    app.get('/enterprise', passport.authenticate('bearer', { session: false }), EnterpriseController.getEnterprise);
    app.get('/enterprises', passport.authenticate('bearer', { session: false }), EnterpriseController.getAllEnterprises);
    app.get('/', passport.authenticate('bearer', { session: false }), EnterpriseController.getEnterprise);
    app.post('/enterprises', passport.authenticate('bearer', { session: false }), EnterpriseController.addEnterprise);
    app.get('/enterprises/users/:id', passport.authenticate('bearer', { session: false }), EnterpriseController.getEnterprisesUsers);

    return app;
}();