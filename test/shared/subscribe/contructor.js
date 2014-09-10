'use strict';

var test = require('tape');
var adapters = require('../../helpers').adapters;

adapters.forEach(function(adapterName) {
  var adapter = require('../../../lib/mqee')(adapterName);
  var sub = null;

  test('shared/subscribe/constructor:with_name', function(assert) {
    sub = new adapter.Subscriber({
      channel: 'cats'
    });
    assert.ok(sub);
    assert.equal(sub.channel, 'cats');
    assert.end();
  });

  test('shared/subscribe/constructor:empty', function(assert) {
    assert.throws(new adapter.Subscriber(), 'channel is required');
    assert.end();
  });

  test('shared/subscribe/constructor:empty_object', function(assert) {
    assert.throws(new adapter.Subscriber({}), 'channel is required');
    assert.end();
  });

  test('shared/subscribe/constructor:null_channel', function(assert) {
    assert.throws(new adapter.Subscriber({
      channel: null
    }), 'channel is required');
    assert.end();
  });

});
