'use strict';

var test = require('tape');
var adapters = require('../../helpers').adapters;

adapters.forEach(function(adapterName) {
  var adapter = require('../../../lib/mqee')(adapterName);
  var meow = {
    'meow':'yisss'
  };
  var pub = null;
  var channel = null;

  test('shared/subscribe/write:ready', function(assert) {
    pub = new adapter.Publish();
    assert.ok(pub);
    pub.on('ready', function(err) {
      assert.equal(err, null);
      channel = pub.channel('cats');
      assert.end();
    });
  });

  test('teardown', function(assert) {
    pub.close(assert.end);
  });
});
