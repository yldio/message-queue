'use strict';

var test = require('tape');
var _ = require('underscore');
var helpers = require('../helpers');

var publishFactory = require('../../lib/publish');
var mockPublisher  = helpers.readFixture('adapters/mock.js');

test('lib/publish/no_name', function(assert) {
  assert.throws(publishFactory, /name is required/);
  assert.end();
});

test('lib/publish/no_defaults', function(assert) {
  assert.throws(function() {
    publishFactory({name: 'foo'});
  }, /defaults is required/);
  assert.end();
});

test('lib/publish/bad_defaults', function(assert) {
  assert.throws(function() {
    publishFactory({
      name: 'foo',
      defaults: 1
    });
  }, /defaults must be an object/);
  assert.end();
});

test('lib/publish/no_defaults_port', function(assert) {
  assert.throws(function() {
    publishFactory({
      name: 'foo',
      defaults: {}
    });
  }, /port is required/);
  assert.end();
});

test('lib/publish/bad_defaults_port', function(assert) {
  assert.throws(function() {
    publishFactory({
      name: 'foo',
      defaults: {
        port: 'abc'
      }
    });
  }, /port must be a number/);
  assert.end();
});

test('lib/publish/no_defaults_host', function(assert) {
  assert.throws(function() {
    publishFactory({
      name: 'foo',
      defaults: {
        port: 1313
      }
    });
  }, /host is required/);
  assert.end();
});

test('lib/publish/bad_defaults_host', function(assert) {
  assert.throws(function() {
    publishFactory({
      name: 'foo',
      defaults: {
        port: 1313,
        host: 'http://local'
      }
    });
  }, /host must be a valid hostname/);
  assert.end();
});

var reduceOpts = [
  'createClient',
  'destroyClient',
  'whenReady',
  'publish'
].reduce(function(ac, method) {
  var opts = _.clone(ac);
  test('lib/publish/no_' + method, function(assert) {
    assert.throws(function() {
      publishFactory(opts);
    }, new RegExp(method + ' is required'));
    assert.end();
  });

  test('lib/publish/bad_' + method, function(assert) {
    assert.throws(function() {
      opts[method] = false;
      publishFactory(opts);
    }, new RegExp(method + ' must be a Function'));
    assert.end();
  });

  ac[method] = function() {};
  return ac;
}, {
  name: 'foo',
  defaults: {
    port: 1313,
    host: 'local'
  }
});

test('lib/publish/factory', function(assert) {
  var fromReduce = publishFactory(reduceOpts);
  assert.equal(fromReduce.defaults.port, 1313);
  assert.equal(fromReduce.defaults.host, 'local');
  assert.end();
});

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
  mockPublisher.publish = function(cli) {
    return function(name, chunk, enc, cb) {
      cli.onError(new Error('This happened'));
      cb();
    };
  };

  var pubPub = new publishFactory(mockPublisher)();

  pubPub.publish('queue', 'hey', 'utf-8', assert.end);
  pubPub.on('error', function(err) {
    assert.equal(err.message, 'This happened');
  });
});

test('lib/publish/whenReady:fails', function(assert) {
  mockPublisher.whenReady = function() {
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
