'use strict';

var test = require('tape');
var adapters = require('../../helpers').adapters;

adapters.forEach(function(adapterName) {
  var adapter = require('../../../lib/mqee')(adapterName);
  var meow = {
    'meow':'yisss'
  };
  var pub = null;
  var channel = null;

  test('shared/publish/write:ready', function(assert) {
    pub = new adapter.Publish();
    assert.ok(pub);
    pub.on('ready', function(err) {
      assert.equal(err, null);
      channel = pub.channel('cats');
      assert.end();
    });
  });

  test('shared/publish/write:plaintext', function(assert) {
    channel.write('meow', function(err, info) {
      assert.equal(err, null);
      assert.ok(info.ack);
      assert.equal(typeof info.ts, 'Date');
      assert.equal(info.written, 'meow');
      assert.end();
    });
  });

  test('shared/publish/write:json_as_text', function(assert) {
    channel.write(JSON.stringify(meow), function(err, info) {
      assert.equal(err, null);
      assert.ok(info.ack);
      assert.equal(info.written, JSON.stringify(meow));
      assert.end();
    });
  });

  test('shared/publish/write:json', function(assert) {
    channel.write(meow, function(err, info) {
      assert.equal(err, null);
      assert.ok(info.ack);
      assert.deepEqual(info.written, meow);
      assert.end();
    });
  });

  test('shared/publish/write:circular', function(assert) {
    var data = {name: 'felix'};
    data.data = data;
    channel.write(data, function(err, info) {
      assert.equal(err, null);
      assert.ok(info.ack);
      assert.deepEqual(info.written, {name: 'felix', data: '[circular]'});
      assert.end();
    });
  });

  //
  // fixme: add test for on('error')
  //

  test('teardown', function(assert) {
    pub.close(assert.end);
  });
});
