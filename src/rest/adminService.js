/**
 * Created by randy on 9/19/15.
 */

var EnterpriseController            = require('./controllers/enterpriseController');
//var passport                        = require('passport');


module.exports = function() {

    var express = require('express');
    var app = express();

    app.get('/enterprise', EnterpriseController.getEnterprise);
    app.post('/enterprise', EnterpriseController.setEnterprise);

    return app;
}();