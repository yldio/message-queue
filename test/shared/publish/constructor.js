'use strict';

var test = require('tape');
var adapters = require('../../helpers').adapters;

adapters.forEach(function(adapterName) {
  var adapter = require('../../../lib/mqee')(adapterName);
  var defaults = adapter.Publish.defaults;
  var pub = null;

  test('shared/publish/constructor:defaults', function(assert) {
    assert.equal(typeof defaults, 'object');
    assert.ok(defaults.host);
    assert.ok(defaults.port);
    assert.end();
  });

  test('shared/publish/constructor:specifies_port', function(assert) {
    pub = new adapter.Publish({port: 1717});
    pub.on('error', console.error);
    assert.ok(pub);
    assert.equal(pub.port, 1717);
    assert.equal(pub.host, defaults.host);
    pub.close(assert.end);
  });

  test('shared/publish/constructor:specifies_host', function(assert) {
    pub = new adapter.Publish({host: 'lhost'});
    pub.on('error', console.error);
    assert.equal(pub.port, +defaults.port);
    assert.equal(pub.host, 'lhost');
    pub.close(assert.end);
  });

  test('shared/publish/constructor:specifies_host_and_port', function(assert) {
    pub = new adapter.Publish({host: 'rhost', port: 5656});
    pub.on('error', console.error);
    assert.equal(pub.port, 5656);
    assert.equal(pub.host, 'rhost');
    pub.close(assert.end);
  });

  test('shared/publish/constructor:string_port', function(assert) {
    pub = new adapter.Publish({port: '1717'});
    pub.on('error', console.error);
    assert.equal(pub.port, 1717);
    assert.equal(pub.host, defaults.host);
    pub.close(assert.end);
  });

  test('shared/publish/constructor:empty_constructor', function(assert) {
    pub = new adapter.Publish();
    pub.on('error', console.error);
    assert.equal(pub.port, +defaults.port);
    assert.equal(pub.host, defaults.host);
    pub.close(assert.end);
  });

  test('shared/publish/constructor:other_properties', function(assert) {
    pub = new adapter.Publish({foo: 'something else'});
    pub.on('error', console.error);
    assert.equal(pub.meta.foo, 'something else');
    assert.equal(pub.meta.port, undefined);
    assert.equal(pub.meta.host, undefined);
    pub.close(assert.end);
  });
});
