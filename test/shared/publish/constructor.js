'use strict';

var fs = require('fs');
var path = require('path');
var test = require('tape');

var adapters = fs.readdirSync(
  path.join(__dirname, '..', '..', '..', 'lib', 'adapters'));

adapters.forEach(function(adapterName) {
  var adapter = require('../../../lib/mqee')(adapterName);
  var defaults = adapter.defaults;
  var pub = null;

  test('shared:publish:constructor:defaults', function(assert) {
    assert.equal(typeof defaults, 'object');
    assert.ok(defaults.host);
    assert.ok(defaults.port);
    assert.end();
  });

  test('shared:publish:constructor:specifies_port', function(assert) {
    pub = new adapter.Publish({port: 1717});
    assert.ok(pub);
    assert.equal(pub.port, 1717);
    assert.equal(pub.host, defaults.host);
    assert.end();
  });

  test('shared:publish:constructor:specifies_host', function(assert) {
    pub = new adapter.Publish({host: 'lhost'});
    assert.ok(pub);
    assert.equal(pub.port, defaults.port);
    assert.equal(pub.host, 'lhost');
    assert.end();
  });

  test('shared:publish:constructor:specifies_host_and_port', function(assert) {
    pub = new adapter.Publish({host: 'rhost', port: 5656});
    assert.ok(pub);
    assert.equal(pub.port, 5656);
    assert.equal(pub.host, 'rhost');
    assert.end();
  });

  test('shared:publish:constructor:string_port', function(assert) {
    pub = new adapter.Publish({port: '1717'});
    assert.ok(pub);
    assert.equal(pub.port, 1717);
    assert.equal(pub.host, defaults.host);
    assert.end();
  });

  test('shared:publish:constructor:empty_constructor', function(assert) {
    pub = new adapter.Publish();
    assert.ok(pub);
    assert.equal(pub.port, defaults.port);
    assert.equal(pub.host, defaults.host);
    assert.end();
  });
});
