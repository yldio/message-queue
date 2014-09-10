'use strict';

var test = require('tape');
var helpers = require('../../helpers');
var adapters = helpers.adapters;

adapters.forEach(function(adapterName) {
  var adapter = require('../../../lib/mqee')(adapterName);

  var goodKitten        = helpers.readFixture('cats/good.json');
  var badKittenNoWhen   = helpers.readFixture('cats/amelie.json');
  var badKittenNoName   = helpers.readFixture('cats/noname.json');
  var badKittenBadLikes = helpers.readFixture('cats/felix.json');
  var filteredKitten    = helpers.readFixture('cats/doug.json');
  var topic             = helpers.readFixture('topics/cat_created.js');

  var pub = null;
  var channel = null;

  test('shared/publish/topics:ready', function(assert) {
    pub = new adapter.Publish();
    assert.ok(pub);
    pub.on('ready', function(err) {
      assert.equal(err, undefined);
      channel = pub.channel('cats', {
        schema: topic
      });
      assert.end();
    });
  });

  test('shared/publish/topics:goodKitten', function(assert) {
    channel.publish(goodKitten, function(err, info) {
      assert.equal(err, undefined);
      assert.ok(info.ack);
      assert.deepEqual(JSON.parse(info.written), goodKitten);
      assert.end();
    });
  });

  test('shared/publish/topics:goodKitten_with_date', function(assert) {
    goodKitten.when = new Date();
    channel.publish(goodKitten, function(err, info) {
      assert.equal(err, undefined);
      goodKitten.when = goodKitten.when.toISOString();
      assert.deepEqual(JSON.parse(info.written), goodKitten);
      assert.end();
    });
  });

  test('shared/publish/topics:badKittenNull', function(assert) {
    channel.publish(null, function(err) {
      assert.equal(err.message, 'value must be an object');
      assert.end();
    });
  });

  test('shared/publish/topics:badKittenEmpty', function(assert) {
    channel.publish({}, function(err) {
      assert.equal(err.message, 'when is required');
      assert.end();
    });
  });

  test('shared/publish/topics:badKittenEmpty', function(assert) {
    channel.publish({when: 'String'}, function(err) {
      assert.equal(err.message,
        'when must be a number of milliseconds or valid date string');
      assert.end();
    });
  });

  test('shared/publish/topics:badKittenString', function(assert) {
    channel.publish('meow', function(err) {
      assert.equal(err.message, 'Expecting object not string');
      assert.end();
    });
  });

  test('shared/publish/topics:badKittenNoWhen', function(assert) {
    channel.publish(badKittenNoWhen, function(err) {
      assert.equal(err.message, 'when is required');
      assert.end();
    });
  });

  test('shared/publish/topics:badKittenNoName', function(assert) {
    channel.publish(badKittenNoName, function(err) {
      assert.equal(err.message, 'name is required');
      assert.end();
    });
  });

  test('shared/publish/topics:badKittenBadLikes', function(assert) {
    channel.publish(badKittenBadLikes, function(err) {
      assert.equal(err.message, 'likes must be an array');
      assert.end();
    });
  });

  test('shared/publish/topics:filteredKitten', function(assert) {
    var newFilteredKitten = {
      when: filteredKitten.when,
      name: filteredKitten.name,
      likes: filteredKitten.likes
    };
    channel.publish(filteredKitten, function(err, info) {
      assert.equal(err, undefined);
      assert.ok(info.ack);
      assert.deepEqual(JSON.parse(info.written), newFilteredKitten);
      assert.end();
    });
  });

  test('teardown', function(assert) {
    pub.close(assert.end);
  });
});
