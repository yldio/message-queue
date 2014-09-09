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

  test('shared:publish:write:ready', function(assert) {
    pub = new adapter.Publish();
    assert.ok(pub);
    assert.equal(pub.port, defaults.port);
    assert.equal(pub.host, defaults.host);
    pub.on('ready', assert.end);
  });

  test('shared:publish:write:channel', function(assert) {
    assert.end();
  });
});
