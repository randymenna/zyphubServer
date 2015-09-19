/**
 * Created by randy on 9/19/15
 */

var async                   = require('async');
var jwt                     = require('jwt-simple');
var config                  = require('config');
var model                   = require('../../models/models');

exports.setEnterprise = function (req, res) {

    console.log('setEnterprise(): entered');
    async.waterfall(
        [
            function (callback) {

                var enterpriseModel = {};
                enterpriseModel.name = req.body.name;
                enterpriseModel.contact = req.body.contact;

                var e = new model.Enterprise(enterpriseModel);

                var claims = {
                    'iss': 'conversepoint.com',
                    'iat':  Math.round(+new Date()/1000),
                    'exp':  Math.round(+new Date()/1000) + 31536000,    // 1 year
                    'sub': 'api',
                    'aud': e.name,
                    'jti': e._id.toString()
                };
                e.apiKey = jwt.encode(claims, config.jwt.apikeysecret);

                e.save(function(err, enterprise){
                    if ( err ) {
                        console.log('setEnterprise(): Error: cannot save %s',enterprise.name);
                    }
                    callback( err, enterprise );
                });
            }
        ],

        function (err, enterprise) {
            console.log('setEnterprise(): exiting: err=%s,result=%s', err, enterprise);
            if (!err) {
                res.status(200).json(enterprise.apiKey);
            } else {
                res.status(401).json(err);
            }
        }
    );
};

exports.getEnterprise = function (req, res) {

    console.log('getEnterprise(): entered: req.body.name');
    var name = req.body.name ? req.body.name: req.query.name;

    async.waterfall(
        [
            function (callback) {
                model.Enterprise.findOne({name:name})
                    .exec(function(err, e){
                        if ( err ) {
                            callback(err, null);
                        }
                        else {
                            var enterprise = e.toObject();
                            callback(null, enterprise);
                        }
                    });
            }
        ],

        function (err, enterprise) {
            console.log('getEnterprise(): exiting: err=%s,result=%s', err, enterprise);
            if (!err) {
                delete enterprise._id;
                delete enterprise.__v;
                delete enterprise.modified;
                delete enterprise.created;

                res.status(200).json(enterprise);
            } else {
                res.status(401).json(err);
            }
        }
    );
};