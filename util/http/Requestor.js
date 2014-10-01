/**
 * Module dependencies
 *
 */
var http        = require('http');
var https       = require('https');
var Q           = require('q');
var Request     = require('./request');
var Response    = require('./response');

/**
 * Is the request was successful or not
 * @param {number} code
 * @returns {boolean}
 */
function isSuccessful (code) {
    return code >= 200 && code < 300;
}


var Requestor = module.exports = function Requestor() {
    'use strict';

    /**
     * The response encoding
     * @type {string}
     */
    this.responseEncoding = 'utf8';

    /**
     * Returns http|s instance according to the given protocol
     * @param protocol
     * @returns {http|https}
     */
    this.getHttp = function(protocol) {
        if (protocol === 'https:') {
            return https;
        }

        return http;
    };

    /**
     * Executes the given request object.
     * @param {Request} request
     * @param {Q.defer} defer
     */
    this.call = function call(request, defer) {
        var httpRequest,
            options,
            http = this.getHttp(request.getProtocol()),
            timeout;

        // Define options according to Request object interface
        options = {
            hostname: request.getHost(),
            path: request.getUri(),
            port: request.getPort(),
            method: request.method,
            auth: request.getAuthorization(),
            headers: request.getHeaders()
        };

        /**
         * Handle request callback
         */
        httpRequest = http.request(options, function(res) {
            clearTimeout(timeout);
            var response = new Response(res.statusCode, res.headers);

            res.setEncoding(this.responseEncoding);
            res.on('data', function(chunk) {
                response.setChunk(chunk);
            });

            res.on('end', function() {
                if (isSuccessful(response.code)) {
                    defer.resolve(response);
                    return;
                }

                defer.reject(response);
            });
        });

        /**
         * Abort and reject on timeout
         */
        timeout = setTimeout(function() {
            httpRequest.abort();
            defer.reject(new Response(405, {}, 'timeout exceeded'));
        }, request.timeout);

        /**
         * Reject on error and pass the given error object
         */
        httpRequest.on('error', function(error) {
            defer.reject(error);
        });

        httpRequest.end(request.getBody());

        return defer.promise;
    };


    /**
     * Request router, handles caching
     * @param {Request} request
     * @returns {Q.promise}
     */
    this.callRouter = function callRouter(request) {
        var defer = Q.defer();

        if ( request.method !== 'GET' ) {
            return this.call(request, defer);
        }

        return defer.promise;
    };
};

Requestor.prototype.request = function(url, options) {
    return this.callRouter(new Request(url, options));
};

Requestor.prototype.responseEncoding = function(value) {
    if (!value) {
        return this.responseEncoding;
    }

    this.responseEncoding = value;
    return this;
};