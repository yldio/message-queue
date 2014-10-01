'use strict';

var helpers = require('../../helpers');
var adapters = helpers.adapters;

adapters.forEach(function(adapterName) {
  var test = helpers.testFor(adapterName, ['shared', 'publish', 'topics']);
  var adapter = require('../../../lib')(adapterName);

  var goodKitten        = helpers.readFixture('cats/good.json');
  var badKittenNoWhen   = helpers.readFixture('cats/amelie.json');
  var badKittenNoName   = helpers.readFixture('cats/noname.json');
  var badKittenBadLikes = helpers.readFixture('cats/felix.json');
  var filteredKitten    = helpers.readFixture('cats/doug.json');
  var topic             = helpers.readFixture('topics/cat_created.js');

  var pub = null;
  var channel = null;

  test('should fire `ready`', function(assert) {
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

  test('should publish something that passes validation', function(assert) {
    channel.publish(goodKitten, function(err, info) {
      assert.equal(err, undefined);
      assert.ok(info.ack);
      assert.deepEqual(JSON.parse(info.written), goodKitten);
      assert.end();
    });
  });

  test('should be able to handle dates', function(assert) {
    goodKitten.when = new Date();
    channel.publish(goodKitten, function(err, info) {
      assert.equal(err, undefined);
      goodKitten.when = goodKitten.when.toISOString();
      assert.deepEqual(JSON.parse(info.written), goodKitten);
      assert.end();
    });
  });

  test('should not publish `null` when expecting schema', function(assert) {
    channel.publish(null, function(err) {
      assert.equal(err.message, 'Expecting object not null');
      assert.end();
    });
  });

  test('should not allow empty when expecting schema', function(assert) {
    channel.publish({}, function(err) {
      assert.equal(err.message, 'when is required');
      assert.end();
    });
  });

  test('should not allow for wrong type on time stamp', function(assert) {
    channel.publish({when: 'String'}, function(err) {
      assert.equal(err.message,
        'when must be a number of milliseconds or valid date string');
      assert.end();
    });
  });

  test('should not publish string when expecting object', function(assert) {
    channel.publish('meow', function(err) {
      assert.equal(err.message, 'Expecting object not string');
      assert.end();
    });
  });

  test('should require a `when` property', function(assert) {
    channel.publish(badKittenNoWhen, function(err) {
      assert.equal(err.message, 'when is required');
      assert.end();
    });
  });

  test('should require a `name` property', function(assert) {
    channel.publish(badKittenNoName, function(err) {
      assert.equal(err.message, 'name is required');
      assert.end();
    });
  });

  test('should required the kitten to like stuff', function(assert) {
    channel.publish(badKittenBadLikes, function(err) {
      assert.equal(err.message, 'likes must be an array');
      assert.end();
    });
  });

  test('should allow publishing when validation works', function(assert) {
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
