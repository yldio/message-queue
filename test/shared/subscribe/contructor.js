'use strict';

var fs = require('fs');
var path = require('path');
var test = require('tape');

var adapters = fs.readdirSync(
  path.join(__dirname, '..', '..', '..', 'lib', 'adapters'));

adapters.forEach(function(adapterName) {
  var adapter = require('../../../lib/mqee')(adapterName);
  var sub = null;

  test('shared:subscribe:constructor:with_name', function(assert) {
    sub = new adapter.Subscriber({
      channel: 'cats'
    });
    assert.ok(sub);
    assert.equal(pub.channel, 'cats');
    assert.end();
  });

  test('shared:subscribe:constructor:empty', function(assert) {
    assert.throws(new adapter.Subscriber(), 'Channel name not specified');
    assert.end();
  });

  test('shared:subscribe:constructor:empty_object', function(assert) {
    assert.throws(new adapter.Subscriber({}), 'Channel name not specified');
    assert.end();
  });

  test('shared:subscribe:constructor:null_channel', function(assert) {
    assert.throws(new adapter.Subscriber({
      channel: null
    }), 'Channel name not specified');
    assert.end();
  });

});
