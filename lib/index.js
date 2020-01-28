'use strict';

// forked from https://www.npmjs.com/package/swaggerize-routes version 1.0.11

var assert = require('assert'),
    enjoi = require('enjoi'),
    thing = require('core-util-is'),
    path = require('path'),
    caller = require('caller'),
    utils = require('./utils'),
    buildroutes = require('./buildroutes'),
    swaggerSchema = require('swagger-schema-official/schema');


function swaggerize(options) {
    var schemas;

    assert.ok(thing.isObject(options), 'Expected options to be an object.');
    assert.ok(thing.isObject(options.api), 'Expected an api definition.');

    if ('basedir' in options) {
        assert.ok(thing.isString(options.basedir), 'Expected basedir to be a string.');
        assert.ok(options.basedir.length, 'Expected basedir to be a non-empty string.');
    }

    if ('schemas' in options) {
        assert.ok(thing.isArray(options.schemas), 'Expected schemas option to be an array.');
    }

    if ('handlers' in options) {
        assert.ok(thing.isString(options.handlers) || thing.isObject(options.handlers), 'Expected handlers to be a string or an object.');
        assert.ok(!thing.isString(options.handlers) || options.handlers.length, 'Expected handlers to be a non-empty string.');
    }
    //If basedir is falsy, Use the default basedir.
    basedir = basedir || Path.dirname(Caller());
    //If handlers is truthy, it should be a valid option.
    if (handlers) {
        Assert.ok(isString(handlers) || isObject(handlers), 'Expected handlers to be a string or an object.');
        Assert.ok(!isString(handlers) || handlers.length, 'Expected handlers to be a non-empty string.');
    } else {
        //If handlers options is not set, use the default dir name `handlers` (only if the dir exists).
        let defaultPath = Path.join(basedir, './handlers');
        // For a one time lookup and invocation during configuration,
        // using the sync fs utils.
        if (Fs.existsSync(defaultPath) && Fs.statSync(defaultPath).isDirectory()) {
            handlers = defaultPath;
        }
    }
    //For string handlers, resolve to basedir
    if (Thing.isString(handlers) && Path.resolve(handlers) !== handlers) {
        // Relative path, so resolve to basedir
        handlers = Path.join(basedir, handlers);
    }
    //If the api is not yet validated, do it here
    routeObj = Buildroutes((!validated) ? Parser.validate(api) : Promise.resolve(api), Object.assign({}, options, { basedir, handlers }));

    return Maybe(callback, routeObj);
};

module.exports = Swaggerize;
