'use strict';

var helpers = require('../../helpers');
var adapters = require('../../helpers').adapters;

adapters.forEach(function(adapterName) {
  var test = helpers.testFor(adapterName, [
    'shared',
    'subscribe',
    'constructor'
  ]);

  var adapter = require('../../../lib')(adapterName);

  test('should create a subscriber for the channel', function(assert) {
    var sub = new adapter.Subscribe({
      channel: 'cats'
    });
    assert.ok(sub);
    assert.equal(sub.channel, 'cats');
    sub.on('error', assert.pass);
    sub.close(assert.end);
  });

  test('should require a channel name', function(assert) {
    assert.plan(1);
    assert.throws(function() {
      new adapter.Subscribe();
    }, /channel is required/);
  });

  test('should not allow empty object', function(assert) {
    assert.plan(1);
    assert.throws(function() {
      new adapter.Subscribe({});
    }, /channel is required/);
  });

  test('should not allow a `null` channel', function(assert) {
    assert.plan(1);
    assert.throws(function() {
      new adapter.Subscribe({
        channel: null
      });
    }, /channel is required/);
    //
    // @fixme there's no test for if this throws
    //        and we emit.close before emitter.closed
    //        is defined. couldnt find a good way of
    //        writing that test
    //
  });

});
