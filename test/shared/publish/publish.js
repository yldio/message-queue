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

  test('shared/publish/publish:ready', function(assert) {
    pub = new adapter.Publish();
    assert.ok(pub);
    pub.on('ready', function(err) {
      assert.equal(err, undefined);
      channel = pub.channel('cats');
      pub.close(assert.end);
    });
  });

  test('shared/publish/publish:plaintext', function(assert) {
    channel.publish('meow', function(err, info) {
      assert.equal(err, undefined);
      assert.ok(info.ack);
      assert.equal(typeof info.ts, 'object');
      assert.equal(typeof info.ts.toISOString, 'function');
      assert.equal(info.written, 'meow');
      assert.end();
    });
  });

  test('shared/publish/publish:json_as_text', function(assert) {
    channel.publish(JSON.stringify(meow), function(err, info) {
      assert.equal(err, undefined);
      assert.ok(info.ack);
      assert.equal(info.written, JSON.stringify(meow));
      assert.end();
    });
  });

  test('shared/publish/publish:json', function(assert) {
    channel.publish(meow, function(err, info) {
      assert.equal(err, undefined);
      assert.ok(info.ack);
      assert.deepEqual(JSON.parse(info.written), meow);
      assert.end();
    });
  });

  test('shared/publish/publish:circular', function(assert) {
    var data = {name: 'felix'};
    data.data = data;
    channel.publish(data, function(err, info) {
      assert.equal(err, undefined);
      assert.ok(info.ack);
      assert.equal(
        info.written,
        JSON.stringify({name: 'felix', data: '[Circular ~]'}));
      assert.end();
    });
  });

  test('teardown', function(assert) {
    pub.close(assert.end);
  });
});
