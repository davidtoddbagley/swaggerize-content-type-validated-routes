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

function swaggerize(options, validateRequestedRoute) {

    let schemas;

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

    let validateRoute;
    if (validateRequestedRoute
        && 'mediaType' in validateRequestedRoute
        && 'method' in validateRequestedRoute
    ) {
        try {
            assert.ok(thing.isString(validateRequestedRoute.mediaType) || thing.isObject(validateRequestedRoute.mediaType), 'Expected mediaType to be a string or an object.');
            assert.ok(!thing.isString(validateRequestedRoute.mediaType) || validateRequestedRoute.mediaType.length, 'Expected mediaType to be a non-empty string.');
            assert.ok(thing.isString(validateRequestedRoute.method) || thing.isObject(validateRequestedRoute.method), 'Expected method to be a string or an object.');
            assert.ok(!thing.isString(validateRequestedRoute.method) || validateRequestedRoute.method.length, 'Expected method to be a non-empty string.');
            validateRoute = validateRequestedRoute;
        } catch (err) {
            console.log('swaggerize-content-type-validated-routes: invalid route validation obj', err);    
        }
    }

    options.basedir = options.basedir || path.dirname(caller());

    schemas = {
        '#': swaggerSchema
    };

    // Map and validate API against schemas
    if (thing.isArray(options.schemas)) {
        options.schemas.forEach(function (schema) {
            assert.ok(thing.isObject(schema), 'Expected schema option to be an object.');
            assert.ok(thing.isString(schema.name), 'Expected schema name to be a string.');
            assert.ok(schema.name && schema.name !== '#', 'Schema name can not be base schema.');
            assert.ok(thing.isString(schema.schema) || thing.isObject(schema.schema), 'Expected schema to to an object.');

            if (thing.isString(schema.schema)) {
                schema.schema = require(path.resolve(options.basedir, schema.schema));
            }

            schemas[schema.name] = schema.schema;
        });
    }

    enjoi(swaggerSchema, schemas).validate(options.api, function (error) {
        assert.ifError(error);
    });

    // Resolve path to handlers
    options.handlers = options.handlers || './handlers';

    if (thing.isString(options.handlers) && path.resolve(options.handlers) !== options.handlers) {
        // Relative path, so resolve to basedir
        options.handlers = path.join(options.basedir, options.handlers);
    }

    const swaggerRoutes = buildroutes(options);

    if (!validateRoute) {
        return swaggerRoutes;
    }

    let swaggerRoute = swaggerRoutes.filter(swaggerRoute => {
        return swaggerRoute.path.trim() === validateRoute.path.trim()
          && swaggerRoute.method.trim().toLowerCase() === validateRoute.method.trim().toLowerCase();
      });
    if (swaggerRoute && swaggerRoute.length > 0) {
        swaggerRoute = swaggerRoute[0];
    }

    const reqMediaType = validateRoute.mediaType.toLowerCase();
    const swContentTypes = swaggerRoute && swaggerRoute.produces || [];
    if (swaggerRoute && swaggerRoute.mediatypes && swaggerRoute.mediatypes.length > 0) {
        const mediatypes = swaggerRoute.mediatypes;
        swContentTypes.push(...mediatypes);
    }

    const isInvalid = !swContentTypes.filter(swContentType => {
            const swct = swContentType.trim();
            return !!swct && reqMediaType.includes(swct);
        }).length > 0;
    if (isInvalid) {
        throw Error(`Unsupported Media Type: ${reqMediaType}`);
    }

    return swaggerRoute;
}


module.exports = swaggerize;
