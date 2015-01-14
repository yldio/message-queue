'use strict';

var helpers = require('../../helpers');
var adapters = require('../../helpers').adapters;

adapters.forEach(function(adapterName) {
  var test = helpers.testFor(adapterName, [
    'shared',
    'publish',
    'freelist.FreeList(name, max, constructor);ctor'
  ]);

  var adapter   = require('../../../lib')(adapterName);
  var defaults  = adapter.Publish.defaults;
  var pub       = null;

  var port = adapterName === 'kafka' ? 2181 : 
    adapterName === 'amqp' ? 5672 : 6379;

  test('defaults should include host and port', function(assert) {
    assert.equal(typeof defaults, 'object');
    assert.ok(defaults.host);
    assert.ok(defaults.port);
    assert.end();
  });

  test('assumes default host and allow specifying port', function(assert) {
    debugger
    pub = new adapter.Publish({port: port});
    pub.on('error', assert.fail);
    assert.ok(pub);
    assert.equal(pub.port, port);
    assert.equal(pub.host, defaults.host);
    pub.close(assert.end);
  });

  test('assumes default port and allows specifying host', function(assert) {
    debugger
    pub = new adapter.Publish({host: 'localhost'});
    pub.on('error', assert.fail);
    assert.equal(pub.port, +defaults.port);
    assert.equal(pub.host, 'localhost');
    pub.close(assert.end);
  });

  test('allows specifying both host and port', function(assert) {
    pub = new adapter.Publish({host: 'localhost', port: port});
    pub.on('error', assert.fail);
    assert.equal(pub.port, port);
    assert.equal(pub.host, 'localhost');
    pub.close(assert.end);
  });

  test('can cast a string as port', function(assert) {
    pub = new adapter.Publish({port: port.toString()});
    pub.on('error', assert.fail);
    assert.equal(pub.port, port);
    assert.equal(pub.host, defaults.host);
    pub.close(assert.end);
  });

  test('empty constructor uses defaults', function(assert) {
    pub = new adapter.Publish();
    pub.on('error', assert.fail);
    assert.equal(pub.port, +defaults.port);
    assert.equal(pub.host, defaults.host);
    pub.close(assert.end);
  });

  test('additional properties get added to `meta`', function(assert) {
    pub = new adapter.Publish({foo: 'something else', exchange: 'animals'});
    pub.on('error', assert.fail);
    assert.equal(pub.meta.foo, 'something else');
    assert.equal(pub.meta.port, adapter.Publish.defaults.port);
    assert.equal(pub.meta.host, adapter.Publish.defaults.host);
    pub.close(assert.end);
  });
});
