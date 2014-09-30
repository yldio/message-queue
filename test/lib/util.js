'use strict';

var test = require('tape');

var ut = require('../../lib/util');

test('lib/util<toJSON>', function(assert) {
  assert.equal(ut.toJSON('{{'), null);
  assert.deepEqual(ut.toJSON('{"foo": true}'), {foo: true});
  assert.end();
});

test('lib/util<getType>', function(assert) {
  assert.equal(ut.getType(null), 'null');
  assert.equal(ut.getType('foo'), 'string');
  assert.equal(ut.getType([]), 'array');
  assert.equal(ut.getType({hey: true}), 'object');
  assert.equal(ut.getType(function() {}), 'function');
  assert.end();
});
