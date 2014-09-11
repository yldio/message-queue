'use strict';

var test = require('tape');
var _ = require('underscore');
var debug = require('debug')('test/lib/publish');
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
  'onReady',
  'prepareChannels',
  'publish',
  'createClient',
  'destroyClient',
  'onReady',
  'subscribe'
].reduce(function(ac, method, i, l) {
  var what = ((i + 1) > Math.ceil(l.length / 2)) ? 'subscribe' : 'publish';
  var opts = _.clone(ac);
  var pubOpts = _.clone(ac.publish);
  var subOpts = _.clone(ac.subscribe);
  opts.publish = pubOpts;
  opts.subscribe = subOpts;

  test('lib/publish/no_' + method + '_' + what, function(assert) {
    assert.throws(function() {
      publishFactory(opts);
    }, new RegExp(method + ' is required'));
    assert.end();
  });

  test('lib/publish/bad_' + method + '_' + what, function(assert) {
    assert.throws(function() {
      opts[what][method] = false;
      publishFactory(opts);
    }, new RegExp(method + ' must be a Function'));
    assert.end();
  });

  ac[what][method] = function() {};

  debug(ac);

  return ac;
}, {
  name: 'foo',
  defaults: {
    port: 1313,
    host: 'local'
  },
  publish: {},
  subscribe: {}
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
  mockPublisher.publish.publish = function(cli) {
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
