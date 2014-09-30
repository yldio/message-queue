'use strict';

var test = require('tape');
var helpers = require('../helpers');

var publishFactory = require('../../lib/publish');
var mockPublisher  = helpers.readFixture('adapters/mock.js');

test('lib/publish/instance:does_not_throw', function(assert) {
  var goodPub = null;
  assert.doesNotThrow(function() {
    goodPub = new publishFactory(mockPublisher)();
  });
  assert.equal(goodPub.port, mockPublisher.defaults.port);
  assert.equal(goodPub.host, mockPublisher.defaults.host);
  assert.end();
});

test('lib/publish/publish:fails', function(assert) {
  mockPublisher.publish.publish = function(cli) {
    return function(name, chunk, cb) {
      cli.onError(new Error('This happened'));
      cb();
    };
  };

  var pubPub = new publishFactory(mockPublisher)();

  pubPub.publish('queue', 'hey', assert.end);
  pubPub.on('error', function(err) {
    assert.equal(err.message, 'This happened');
  });
});

/*
test('lib/publish/prepareChannels:fails', function(assert) {
  mockPublisher.publish.prepareChannels = function() {
    return function(cb) {
      cb(new Error('Sad panda'));
    };
  };

  var channelsFail = new publishFactory(mockPublisher)();

  channelsFail.on('error', function(err) {
    assert.equal(err.message, 'Sad Panda');
  });
  channelsFail.on('end', assert.end);
});
*/

test('lib/publish/onReady:fails', function(assert) {
  mockPublisher.publish.onReady = function() {
    return function(cb) {
      cb(new Error('This is a mock'));
    };
  };

  var notReadyPub = new publishFactory(mockPublisher)();

  notReadyPub.on('error', function(err) {
    assert.equal(err.message, 'This is a mock');
  });
  notReadyPub.on('end', function() { assert.end(); });
});
