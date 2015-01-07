'use strict';

var test = require('tape');
var helpers = require('../helpers');

var subscribeFactory = require('../../lib/subscribe');
var mockPublisher  = helpers.readFixture('adapters/mock.js');

test('lib/subscribe/instance:requires_channel', function(assert) {
  var goodSub = null;
  assert.throws(function() {
    goodSub = new subscribeFactory(mockPublisher)({});
  }, /channel is required/);
  assert.end();
});

test('lib/subscribe/instance:does_not_throw', function(assert) {
  var goodSub = null;
  assert.doesNotThrow(function() {
    goodSub = new subscribeFactory(mockPublisher)({
      channel: 'dogs'
    });
  });
  assert.equal(goodSub.port, mockPublisher.defaults.port);
  assert.equal(goodSub.host, mockPublisher.defaults.host);
  assert.end();
});

test('lib/subscribe/subscribe:fails', function(assert) {
  var oldSub = mockPublisher.subscribe.subscribe;
  mockPublisher.subscribe.subscribe = function() {
    return function(next) {
      next('This happened');
    };
  };

  var subSub = new subscribeFactory(mockPublisher)({channel: 'dogs'});

  subSub.on('error', function(err) {
    mockPublisher.subscribe.subscribe = oldSub;
    assert.equal(err.message, 'This happened');
    assert.end();
  });
});

test('lib/subscribe/onReady:fails', function(assert) {
  mockPublisher.subscribe.onReady = function() {
    return function(cb) {
      cb(new Error('This is a mock'));
    };
  };

  var notReadySub = new subscribeFactory(mockPublisher)({channel: 'dogs'});

  notReadySub.on('error', function(err) {
    assert.equal(err.message, 'This is a mock');
  });

  notReadySub.on('end', assert.end);
});
