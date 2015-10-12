/**
 * Created by randy on 9/19/15
 */

var async                   = require('async');
var jwt                     = require('jwt-simple');
var config                  = require('config');
var model                   = require('../../models/models');
var userHelper              = require('./helper/userHelper');

exports.addEnterprise = function (req, res) {

    console.log('addEnterprise(): entered');
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
                        console.log('addEnterprise(): Error: cannot save %s',enterprise.name);
                    }
                    callback( err, enterprise );
                });
            }
        ],

        function (err, enterprise) {
            var ret = err ? null : enterprise.toJSON();
            console.log('addEnterprise(): exiting: err=%s,result=%s', err, ret);
            if (!err) {
                res.status(200).json(ret);
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
                    .lean()
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
            var ret = err ? null : enterprise.toJSON();
            console.log('getEnterprise(): exiting: err=%s,result=%s', err, ret);
            if (!err) {
                res.status(200).json(ret);
            } else {
                res.status(401).json(err);
            }
        }
    );
};

exports.getAllEnterprises = function (req, res) {

    async.waterfall(
        [
            function (callback) {
                model.Enterprise.find()
                    .exec(function(err, e){
                        if ( err ) {
                            callback(err, null);
                        }
                        else {
                            var enterprise = e || [];
                            if (e.toObject !== undefined) {
                                enterprise = e.toObject();
                            }
                            callback(null, enterprise);
                        }
                    });
            }
        ],

        function (err, enterprise) {
            console.log('getAllEnterprises(): exiting: err=%s,result=%s', err, enterprise !== null);
            if (!err) {
                for(var i=0; i < enterprise.length; i++) {
                    enterprise[i] = enterprise[i].toJSON();
                }
                res.status(200).json(enterprise);
            } else {
                res.status(401).json(err);
            }
        }
    );
};

exports.getEnterprisesUsers = function (req, res) {
    var enterpriseId = req.params.id;

    async.waterfall(
        [
            function (callback) {
                model.User.find({enterpriseId: enterpriseId})
                    .exec(function(err, users){
                        if ( err ) {
                            callback(err, null);
                        }
                        else {
                            callback(null, users);
                        }
                    });
            }
        ],

        function (err, users) {
            console.log('getEnterprisesUsers(): exiting: err', err ? 'no error' : err);
            if (!err) {
                for(var i=0; i < users.length; i++) {
                    users[i] = users[i].toJSON();
                }
                res.status(200).json(users);
            } else {
                res.status(401).json(err);
            }
        }
    );
};
