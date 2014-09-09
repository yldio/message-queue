'use strict';

var test = require('tape');
var helpers = require('../../helpers');
var adapters = helpers.adapters;
var timeout = helpers.timeout;

adapters.forEach(function(adapterName) {
  var adapter = require('../../../lib/mqee')(adapterName);

  var validateMeow = require('../../fixtures/topics/meow');

  var sub = null;
  var pub = null;
  var channel = null;
  var dogs = null;

  test('shared/subscribe/message:ready', function(assert) {
    pub = new adapter.Publish();
    assert.ok(pub);
    pub.on('ready', function(err) {
      assert.equal(err, null);
      channel = pub.channel('cats', validateMeow);
      dogs = pub.channel('dogs');
      assert.end();
    });
  });

  test('shared/subscribe/message:newSub', function(assert) {
    sub = new adapter.Subscriber({
      channel: 'cats'
    });
    assert.ok(sub);
    assert.equal(sub.channel, 'cats');
    assert.end();
  });

  test('shared/subscribe/message:meow', function(assert) {
    var meow = {meow: true};
    sub.on('message', function(data) {
      assert.deepEqual(data, meow);
      assert.end();
    });
    channel.write(meow, function(err, info) {
      assert.equal(err, null);
      assert.deepEqual(info.written, meow);
    });
  });

  test('shared/subscribe/message:write_to_wrong_channel', function(assert) {
    var bark = {bark: true};
    sub.on('message', assert.fail);
    bark.write(bark, function(err, info) {
      assert.equal(err, null);
      assert.deepEqual(info.written, bark);
      setTimeout(assert.end, timeout);
    });
  });

  test('shared/subscribe/message:bad_schema', function(assert) {
    var meow = {woof: true};
    sub.on('message', assert.fail);
    channel.write(meow, function(err) {
      assert.equal(err.message, 'meow fails to match the required pattern');
      setTimeout(assert.end, timeout);
    });
  });

  //
  // pipe test
  //

  test('teardown', function(assert) {
    pub.close(assert.end);
  });
});
