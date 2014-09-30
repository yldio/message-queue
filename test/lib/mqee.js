'use strict';

var test = require('tape');

var mqee = require('../../lib/mqee');

test('lib/mqee<properties>', function(assert) {
  assert.equal(mqee.version, require('../../package').version);
  assert.ok(mqee.path);
  assert.deepEqual(mqee.adapters, ['redis', 'amqp']);
  assert.end();
});

test('lib/mqee<wrongAdapter>', function(assert) {
  assert.throws(function() { mqee('not_supported'); },
    /Adapter not_supported is not supported/);
  assert.end();
});

test('lib/mqee<supportedAdapter>', function(assert) {
  assert.doesNotThrow(function() { mqee('redis'); });
  assert.end();
});
