'use strict';

var test = require('tape');

var mq = require('../../lib');

test('lib/message-queue<properties>', function(assert) {
  assert.equal(mq.version, require('../../package').version);
  assert.ok(mq.path);
  assert.ok(mq.Joi);
  assert.deepEqual(mq.adapters, ['redis', 'amqp']);
  assert.end();
});

test('lib/message-queue<wrongAdapter>', function(assert) {
  assert.throws(function() { mq('not_supported'); },
    /Adapter not_supported is not supported/);
  assert.end();
});

test('lib/message-queue<supportedAdapter>', function(assert) {
  assert.doesNotThrow(function() { mq('redis'); });
  assert.end();
});
