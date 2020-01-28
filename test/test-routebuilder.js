const Test = require('tape');
const Path = require('path');
const Buildroutes = require('../lib/builders/routes');
const Parser = require('swagger-parser');
const Thing = require('core-util-is');

const testRoute = (routes, t) => {
    routes.forEach(route => {
        t.comment('***** ' + route.name + ' *****');
        t.ok(route.method, 'Ok method property.');
        t.ok(route.description, 'Ok description property.');
        t.ok(route.name, 'Ok name property.');
        t.ok(route.path, 'Ok path property.');
        t.ok(route.security, 'Ok security property.');
        t.ok(route.validators && Thing.isObject(route.validators), 'Ok validators property.');
        t.ok(route.handler && Thing.isFunction(route.handler), 'Ok handler property.');
        t.ok(route.produces, 'Ok produces property.');
    });
};

const testRouteMustHave = (routes, t) => {
    routes.forEach(route => {
        t.ok(route.method, 'Ok method property.');
        t.ok(route.path, 'Ok path property.');
        t.ok(route.handler, 'Ok handler property.');
    });
};

Test('routebuilder', tester => {
    let routes;
    let routesResolver;
    let apiResolver = Parser.validate(Path.join(__dirname, './fixtures/defs/pets.json'));


    tester.test('build directory', t => {
        routesResolver = Buildroutes(apiResolver, {
            basedir: Path.join(__dirname, 'fixtures'),
            handlers: Path.join(__dirname, 'fixtures/handlers'),
            security: Path.join(__dirname, 'fixtures/extensions')
        });

        t.strictEqual(routes.length, 4, 'added 4 routes.');

        routes.forEach(function (route) {
            t.notEqual(route.method, 'has method property.');
            t.notEqual(route.description, undefined, 'has validate property.');
            t.notEqual(route.name, undefined, 'has name property.');
            t.notEqual(route.path, undefined, 'has path property.');
            t.notEqual(route.security, undefined, 'has security property.');
            t.notEqual(route.validators, undefined, 'has before property.');
            if(route.method === 'get' && route.path === '/pets'){
              t.ok(route.jsonp === 'callback', 'options property is the right one.');
              t.ok(route.cache.statuses.join(',') === '200', 'options property is the right one.');
              t.ok(route.config.plugins.policies.join(', ') === 'isLoggedIn, addTracking, logThis', 'options property is the right one.');
            }
            t.notEqual(route.handler, undefined, 'has handler property.');
            t.notEqual(route.produces, undefined, 'has validate property.');
        });
    });

    tester.test('security definitions', t => {
        var route;

        t.plan(5);

        route = routes[1];
        t.ok(route.security, 'has security definition');
        t.ok(route.security.default && Array.isArray(route.security.default.scopes), 'default has scopes.');
        t.ok(route.security.default && typeof route.security.default.authorize === 'function', 'default has an authorize function.');
        //options.security
        t.ok(route.security.secondary && Array.isArray(route.security.secondary.scopes), 'secondary has scopes.');
        t.ok(route.security.secondary && typeof route.security.secondary.authorize === 'function', 'secondary has an authorize function.');
    });

    tester.test('build from x-handler', t => {
        routesResolver = Buildroutes(apiResolver, {
            basedir: Path.join(__dirname, 'fixtures')
        });

        routesResolver.then(resolved => {
            ({ routes } = resolved);
            t.strictEqual(routes.length, 2, 'added 2 routes.');
            testRoute(routes, t);
            t.end();

        routes.forEach(function (route) {
            t.notEqual(route.method, undefined, 'has method property.');
            t.notEqual(route.description, undefined, 'has validate property.');
            t.notEqual(route.name, undefined, 'has name property.');
            t.notEqual(route.path, undefined, 'has path property.');
            t.notEqual(route.security, undefined, 'has security property.');
            t.notEqual(route.validators, undefined, 'has before property.');
            t.notEqual(route.handler, undefined, 'has handler property.');
            t.notEqual(route.produces, undefined, 'has validate property.');
        });

    });

    tester.test('build with object', t => {
        routesResolver = Buildroutes(apiResolver, {
            basedir: Path.join(__dirname, 'fixtures'),
            handlers: {
                'pets': {
                    $get: function () {},
                    $post: function () {},
                    '{id}': {
                        $get: function () {},
                        $delete: function () {},
                        'items': {
                            $get: function () {},
                            $post: function () {}
                        }
                    }
                }
            }
        });

        routesResolver.then(resolved => {
            ({ routes } = resolved);
            t.strictEqual(routes.length, 6, 'added 6 routes.');
            testRoute(routes, t);
            t.end();
        }).catch(err => {
            t.error(err);
            t.end();
        });
    });

    t.test('build with defaulthandler', function (t) {
        routes = buildroutes({
            api: api,
            basedir: path.join(__dirname, 'fixtures'),
            defaulthandler: function () {},
            schemaValidator: schemaValidator
        });

        t.strictEqual(routes.length, 6, 'added 6 routes.');

        routes.forEach(function (route) {
            t.ok(route.hasOwnProperty('method'), 'has method property.');
            t.ok(route.hasOwnProperty('description'), 'has validate property.');
            t.ok(route.hasOwnProperty('name'), 'has name property.');
            t.ok(route.hasOwnProperty('path'), 'has path property.');
            t.ok(route.hasOwnProperty('security'), 'has security property.');
            t.ok(route.hasOwnProperty('validators'), 'has validators property.');
            t.ok(route.hasOwnProperty('handler'), 'has handler property.');
            t.ok(route.hasOwnProperty('produces'), 'has produces property.');
            t.ok(route.hasOwnProperty('consumes'), 'has consumes property.');
        });

        t.end();
    });

    t.test('route validators', function (t) {
        var route;

        route = routes[1];
        t.strictEqual(route.validators.length, 1, 'has a validator.');
        t.ok(typeof route.validators[0].spec === 'object', 'has spec object property.');
        t.ok(typeof route.validators[0].validate === 'function', 'has validate fn property.');

        route.validators[0].validate({
            id: 0
        }, function (error) {
            t.ok(error, 'validation failed.');
        });

        route.validators[0].validate({
            id: 0,
            name: 'Cat'
        }, function (error) {
            t.ok(!error, 'validation passed.');
        });

        t.end();
    });

    tester.test('route validator merge', t => {
        var route;
        route = routes[5];

        t.strictEqual(route.validators.length, 3, 'has 3 validators.');

        var validator;
        validator = route.validators.filter(validator => {return validator.spec.name === 'date';}).shift();
        t.ok(validator.spec.required, 'override by operation.');

        t.end();
    });

    tester.test('bad dir', t => {

        routesResolver = Buildroutes(apiResolver, {
            handlers: 'asdf'
        });
        routesResolver.catch(err => {
            t.ok(err);
            t.ok(err.code === 'ENOENT', 'Ok error for bad directory');
            t.end();
        });

    });

    tester.test('build with root path', function (t) {
        apiResolver = Parser.validate(Path.join(__dirname, './fixtures/defs/testroot.json'));
        routesResolver = Buildroutes( apiResolver,{
            basedir: Path.join(__dirname, 'fixtures'),
            handlers: {
                $get: function () {},
                other: {
                    $get: function () {}
                }
            }
        });

        t.strictEqual(routes.length, 2, 'added 1 routes.');

        routes.forEach(function (route) {
            t.notEqual(route.method, undefined, 'has method property.');
            t.equal(route.description, undefined, 'has no description property.');
            t.notEqual(route.name, undefined, 'has name property.');
            t.notEqual(route.path, undefined, 'has path property.');
            t.equal(route.security, undefined, 'has no security property.');
            t.notEqual(route.validators, undefined, 'has validators property.');
            t.notEqual(route.handler, undefined, 'has handler property.');
            t.notEqual(route.produces, undefined, 'has produces property.');
            t.notEqual(route.consumes, undefined, 'has consumes property.');
        });
    });
});
