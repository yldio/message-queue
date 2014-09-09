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

  var badKittenNoLikes = {
    when: new Date(),
    name: 'Felix',
    likes: ['food', 'birds', {
      and: ['other', 'things']
    }]
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
      assert.equal(err, null);
      channel = pub.channel('cats', validateCat);
      assert.end();
    });
  });

  test('shared/publish/topics:goodKitten', function(assert) {
    channel.write(goodKitten, function(err, info) {
      assert.equal(err, null);
      assert.ok(info.ack);
      assert.deepEqual(info.written, goodKitten);
      assert.end();
    });
  });

  test('shared/publish/topics:badKittenNull', function(assert) {
    channel.write(null, function(err) {
      assert.equal(err.message, 'body is required');
      assert.end();
    });
  });

  test('shared/publish/topics:badKittenEmpty', function(assert) {
    channel.write({}, function(err) {
      assert.equal(err.message, 'when fails to match the required pattern');
      assert.end();
    });
  });

  test('shared/publish/topics:badKittenString', function(assert) {
    channel.write('meow', function(err) {
      assert.equal(err.message, 'typeof body should be json, is `string`');
      assert.end();
    });
  });

  test('shared/publish/topics:badKittenNoWhen', function(assert) {
    channel.write(badKittenNoWhen, function(err) {
      assert.equal(err.message, 'when fails to match the required pattern');
      assert.end();
    });
  });

  test('shared/publish/topics:badKittenNoName', function(assert) {
    channel.write(badKittenNoName, function(err) {
      assert.equal(err.message, 'name fails to match the required pattern');
      assert.end();
    });
  });

  test('shared/publish/topics:badKittenNoLikes', function(assert) {
    channel.write(badKittenNoLikes, function(err) {
      assert.equal(err.message, 'likes fails to match the required pattern');
      assert.end();
    });
  });

  test('shared/publish/topics:filteredKitten', function(assert) {
    var newFilteredKitten = {
      when: filteredKitten.when,
      name: filteredKitten.name,
      likes: filteredKitten.likes
    };
    channel.write(filteredKitten, function(err, info) {
      assert.equal(err, null);
      assert.ok(info.ack);
      assert.deepEqual(info.written, newFilteredKitten);
      assert.end();
    });
  });

  test('teardown', function(assert) {
    pub.close(assert.end);
  });
});
