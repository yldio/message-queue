'use strict';

var helpers = require('../../helpers');
var adapters = helpers.adapters;

var defAdapterOpts = {
  amqp: {
    channels: ['cats']
  }
};

adapters.forEach(function(adapterName) {
  var test = helpers.testFor(adapterName);
  var adapter = require('../../../lib/mqee')(adapterName);
  var opts = defAdapterOpts[adapterName];
  var meow = {
    'meow':'yisss'
  };

  var pub = null;
  var channel = null;

  test('shared/publish/publish:ready', function(assert) {
    pub = new adapter.Publish(opts);
    assert.ok(pub);
    pub.on('ready', function(err) {
      assert.equal(err, undefined);
      channel = pub.channel('cats');
      assert.end();
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
      debugger
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
      debugger
      assert.equal(
        info.written,
        JSON.stringify({name: 'felix', data: '[Circular ~]'}));
      assert.end();
    });
  });

  test('shared/publish/publish:close_pub', function(assert) {
    assert.pass('should be able to close connection');
    pub.close(function(a,b,c,d) {
      debugger
      assert.end();
    });
  });

  test('shared/publish/publish:cant_publish_to_closed', function(assert) {
    debugger

    channel.publish(meow, function(err) {
      assert.equal(err.message, 'Connection closed');
      assert.end();
    });
  });

  test('teardown', function(assert) {
    pub.close(assert.end);
  });
});
