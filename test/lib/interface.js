'use strict';

var test = require('tape');
var _ = require('underscore');
var debug = require('debug')('test/lib/interface');

['subscribe', 'publish'].forEach(function(factory) {
  var fac = require('../../lib/' + factory);

  test('lib/interface/no_name', function(assert) {
    assert.throws(fac, /name is required/);
    assert.end();
  });

  test('lib/interface/no_defaults', function(assert) {
    assert.throws(function() {
      fac({name: 'foo'});
    }, /defaults is required/);
    assert.end();
  });

  test('lib/interface/bad_defaults', function(assert) {
    assert.throws(function() {
      fac({
        name: 'foo',
        defaults: 1
      });
    }, /defaults must be an object/);
    assert.end();
  });

  test('lib/interface/no_defaults_port', function(assert) {
    assert.throws(function() {
      fac({
        name: 'foo',
        defaults: {}
      });
    }, /port is required/);
    assert.end();
  });

  test('lib/interface/bad_defaults_port', function(assert) {
    assert.throws(function() {
      fac({
        name: 'foo',
        defaults: {
          port: 'abc'
        }
      });
    }, /port must be a number/);
    assert.end();
  });

  test('lib/interface/no_defaults_host', function(assert) {
    assert.throws(function() {
      fac({
        name: 'foo',
        defaults: {
          port: 1313
        }
      });
    }, /host is required/);
    assert.end();
  });

  test('lib/interface/bad_defaults_host', function(assert) {
    assert.throws(function() {
      fac({
        name: 'foo',
        defaults: {
          port: 1313,
          host: 'http://local'
        }
      });
    }, /host must be a valid hostname/);
    assert.end();
  });

  //
  // this is used to test
  // that all interface methods
  // are indeed validated
  //
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
    //
    // when we reach half of this array
    // we go from publisher methods
    // to subscriber methods
    //
    // @fixme: this is a bit cumbersome
    //
    var what = ((i + 1) > Math.ceil(l.length / 2)) ? 'subscribe' : 'publish';
    var opts = _.clone(ac);
    var pubOpts = _.clone(ac.publish);
    var subOpts = _.clone(ac.subscribe);
    opts.publish = pubOpts;
    opts.subscribe = subOpts;

    //
    // test that method must exist
    //
    test('lib/interface/no_' + method + '_' + what, function(assert) {
      assert.throws(function() {
        fac(opts);
      }, new RegExp(method + ' is required'));
      assert.end();
    });

    //
    // test that method is a function
    //
    test('lib/interface/bad_' + method + '_' + what, function(assert) {
      assert.throws(function() {
        opts[what][method] = false;
        fac(opts);
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

  test('lib/interface/factory', function(assert) {
    var fromReduce = fac(reduceOpts);
    assert.equal(fromReduce.defaults.port, 1313);
    assert.equal(fromReduce.defaults.host, 'local');
    assert.end();
  });
});
