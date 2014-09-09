'use strict';

var test = require('tape');
var adapters = require('../../helpers').adapters;

adapters.forEach(function(adapterName) {
  var adapter = require('../../../lib/mqee')(adapterName);

  var goodKitten = {
    when: new Date(),
    name: 'Felix',
    likes: ['food', 'birds', {
      and: ['other', 'things']
    }]
  };

  var badKittenNoWhen = {
    name: 'Amelie',
    likes: {}
  };

  var badKittenNoName = {
    when: new Date(),
    likes: {}
  };

  var badKittenBadLikes = {
    when: new Date(),
    name: 'Felix',
    likes: 'doge'
  };

  var filteredKitten = {
    when: new Date(),
    name: 'Felix',
    ownsHouse: true,
    likes: ['food', 'birds', {
      and: ['other', 'things']
    }]
  };

  var pub = null;
  var channel = null;
  var validateCat = require('../../fixtures/topics/cat_created');

  test('shared/publish/topics:ready', function(assert) {
    pub = new adapter.Publish();
    assert.ok(pub);
    pub.on('ready', function(err) {
      assert.equal(err, undefined);
      channel = pub.channel('cats', {
        schema: validateCat
      });
      assert.end();
    });
  });

  test('shared/publish/topics:goodKitten', function(assert) {
    channel.publish(goodKitten, function(err, info) {
      assert.equal(err, undefined);
      assert.ok(info.ack);
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
      when: filteredKitten.when.toISOString(),
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
