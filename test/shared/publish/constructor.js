'use strict';

var helpers = require('../../helpers');
var adapters = require('../../helpers').adapters;

adapters.forEach(function(adapterName) {
  var test = helpers.testFor(adapterName, ['shared', 'publish', 'constructor']);
  var adapter = require('../../../lib')(adapterName);
  var defaults = adapter.Publish.defaults;
  var pub = null;

  function onError(err) {
    console.error('\n', err);
  }

  test('defaults should include host and port', function(assert) {
    assert.equal(typeof defaults, 'object');
    assert.ok(defaults.host);
    assert.ok(defaults.port);
    assert.end();
  });

  test('assumes default host and allow specifying port', function(assert) {
    pub = new adapter.Publish({port: 1717});
    pub.on('error', onError);
    assert.ok(pub);
    assert.equal(pub.port, 1717);
    assert.equal(pub.host, defaults.host);
    pub.close(assert.end);
  });

  test('assumes default port and allows specifying host', function(assert) {
    pub = new adapter.Publish({host: 'lhost'});
    pub.on('error', onError);
    assert.equal(pub.port, +defaults.port);
    assert.equal(pub.host, 'lhost');
    pub.close(assert.end);
  });

  test('allows specifying both host and port', function(assert) {
    pub = new adapter.Publish({host: 'rhost', port: 5656});
    pub.on('error', onError);
    assert.equal(pub.port, 5656);
    assert.equal(pub.host, 'rhost');
    pub.close(assert.end);
  });

  test('can cast a string as port', function(assert) {
    pub = new adapter.Publish({port: '1717'});
    pub.on('error', onError);
    assert.equal(pub.port, 1717);
    assert.equal(pub.host, defaults.host);
    pub.close(assert.end);
  });

  test('empty constructor uses defaults', function(assert) {
    pub = new adapter.Publish();
    pub.on('error', onError);
    assert.equal(pub.port, +defaults.port);
    assert.equal(pub.host, defaults.host);
    pub.close(assert.end);
  });

  test('additional properties get added to `meta`', function(assert) {
    pub = new adapter.Publish({foo: 'something else', exchange: 'animals'});
    pub.on('error', onError);
    assert.equal(pub.meta.foo, 'something else');
    assert.equal(pub.meta.port, adapter.Publish.defaults.port);
    assert.equal(pub.meta.host, adapter.Publish.defaults.host);
    pub.close(assert.end);
  });
});
