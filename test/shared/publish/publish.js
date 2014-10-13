'use strict';

var helpers = require('../../helpers');
var adapters = helpers.adapters;

var defAdapterOpts = {
  amqp: {
    channels: ['cats']
  }
};

adapters.forEach(function(adapterName) {
  var test = helpers.testFor(adapterName, ['shared', 'publish', 'publish']);
  var adapter = require('../../../lib')(adapterName);
  var opts = defAdapterOpts[adapterName];
  var meow = {
    'meow':'yisss'
  };

  var pub = null;
  var channel = null;

  test('should fire `ready` when ready', function(assert) {
    pub = new adapter.Publish(opts);
    assert.ok(pub);
    pub.on('ready', function(err) {
      assert.equal(err, undefined);
      channel = pub.channel('cats');
      assert.end();
    });
  });

  test('should be able to write plain text', function(assert) { 
    channel.publish('meow', function(err, info) { 
      assert.equal(err, undefined);
      assert.ok(info.ack);
      assert.equal(typeof info.ts, 'object');
      assert.equal(typeof info.ts.toISOString, 'function');
      assert.equal(info.written, 'meow');
      assert.end();
    });
  });

  test('should be able to write json as plain text', function(assert) {
    var plainJSON = JSON.stringify(meow);
    channel.publish(plainJSON, function(err, info) {
      assert.equal(err, undefined);
      assert.ok(info.ack);
      assert.equal(info.written, plainJSON);
      assert.end();
    });
  });

  test('should be able to write json', function(assert) {
    channel.publish(meow, function(err, info) {
      assert.equal(err, undefined);
      assert.ok(info.ack);
      assert.deepEqual(JSON.parse(info.written), meow);
      assert.end();
    });
  });

  test('should remove circular attributes', function(assert) {
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

  test('should be able to receive a Buffer to publish', function(assert) {
    var buff = new Buffer(JSON.stringify(meow));
    channel.publish(buff, function(err, info) {
      assert.equal(err, undefined);
      assert.ok(info.ack);
      assert.deepEqual(JSON.parse(info.written), meow);
      assert.end();
    });
  });

  test('should be able to close the connection', function(assert) {
    pub.close(assert.end);
  });

  test('cant publish after connection is closed', function(assert) {
    channel.publish(meow, function(err) {
      assert.equal(err.message, 'Connection closed');
      assert.end();
    });
  });

  test('teardown', function(assert) {
    pub.close(assert.end);
  });
});
