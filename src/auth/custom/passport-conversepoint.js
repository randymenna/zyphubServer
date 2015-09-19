/**
 * Created by randy on 5/4/15.
 */
/**
 * Module dependencies.
 */
var passport = require('passport-strategy');
var util = require('util');


/**
 * `Strategy` constructor.
 *
 * The local authentication strategy authenticates requests based on the
 * credentials submitted through an HTML-based login form.
 *
 * Applications must supply a `verify` callback which accepts `username` and
 * `password` credentials, and then calls the `done` callback supplying a
 * `user`, which should be set to `false` if the credentials are not valid.
 * If an exception occured, `err` should be set.
 *
 * Optionally, `options` can be used to change the fields in which the
 * credentials are found.
 *
 * Options:
 *   - `usernameField`  field name where the username is found, defaults to _username_
 *   - `passwordField`  field name where the password is found, defaults to _password_
 *   - `passReqToCallback`  when `true`, `req` is the first argument to the verify callback (default: `false`)
 *
 * Examples:
 *
 *     passport.use(new LocalStrategy(
 *       function(username, password, done) {
 *         User.findOne({ username: username, password: password }, function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */
function Strategy(options, verify) {
    if (typeof options === 'function') {
        verify = options;
        options = {};
    }
    if (!verify) { throw new TypeError('ConversePointStrategy requires a verify callback'); }

    this._idField = options._idField || 'id';
    this._keyField = options._keyField || 'key';

    passport.Strategy.call(this);
    this.name = 'conversepoint';
    this._verify = verify;
    this._passReqToCallback = options.passReqToCallback;

    this.lookup = function(obj, field) {
        if (!obj) { return null; }
        var chain = field.split(']').join('').split('[');
        for (var i = 0, len = chain.length; i < len; i++) {
            var prop = obj[chain[i]];
            if (typeof(prop) === 'undefined') { return null; }
            if (typeof(prop) !== 'object') { return prop; }
            obj = prop;
        }
        return null;
    };
}

/**
 * Inherit from `passport.Strategy`.
 */
util.inherits(Strategy, passport.Strategy);

/**
 * Authenticate request based on the contents of a form submission.
 *
 * @param {Object} req
 * @api protected
 */
Strategy.prototype.authenticate = function(req, options) {
    var self = this;

    options = options || {};
    var id = self.lookup(req.body, this._idField) || self.lookup(req.query, this._idField);
    var key = self.lookup(req.body, this._keyField) || self.lookup(req.query, this._keyField);

    if (!id || !key) {
        return this.fail({ message: options.badRequestMessage || 'Missing credentials' }, 400);
    }


    function verified(err, user, info) {
       if (err) { return self.error(err); }
       if (!user) { return self.fail(info); }
        self.success(user, info);
    }

    try {
        if (self._passReqToCallback) {
            this._verify(req, id, key, verified);
        } else {
            this._verify(id, key, verified);
        }
    } catch (ex) {
        return self.error(ex);
    }
};


/**
 * Expose `Strategy`.
 */
module.exports = Strategy;