'use strict';

var test = require('tape');
var fs = require('fs');
var path = require('path');
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
      assert.equal(err, undefined);
      channel = pub.channel('cats', {
        schema: validateMeow
      });
      dogs = pub.channel('dogs');
      assert.end();
    });
  });

  test('shared/subscribe/message:newSub', function(assert) {
    sub = new adapter.Subscribe({
      channel: 'cats'
    });
    sub.on('ready', function() {
      assert.ok(sub);
      assert.equal(sub.channel, 'cats');
      assert.end();
    });
  });

  test('shared/subscribe/message:meow_string', function(assert) {
    var meow = {meow: 'wow'};
    sub.once('message', function(data) {
      assert.notDeepEqual(data, meow);
      assert.deepEqual(typeof data, 'string');
      assert.end();
    });
    channel.publish(meow, function(err, info) {
      assert.equal(err, undefined);
      assert.deepEqual(JSON.parse(info.written), meow);
    });
  });

  test('shared/subscribe/message:meow_json', function(assert) {
    var meow = {meow: 'wow'};
    sub.once('message', function(data) {
      data = this.toJSON(data);
      assert.deepEqual(data, meow);
      assert.deepEqual(typeof data, 'object');
      assert.end();
    });
    channel.publish(meow, function(err, info) {
      assert.equal(err, undefined);
      assert.deepEqual(JSON.parse(info.written), meow);
    });
  });

  test('shared/subscribe/message:write_to_wrong_channel', function(assert) {
    var bark = {bark: true};
    sub.once('message', assert.fail);
    dogs.publish(bark, function(err, info) {
      assert.equal(err, undefined);
      assert.deepEqual(JSON.parse(info.written), bark);
      setTimeout(assert.end, timeout);
    });
  });

  test('shared/subscribe/message:bad_schema', function(assert) {
    var meow = {woof: true};
    sub.once('message', assert.fail);
    channel.publish(meow, function(err) {
      assert.equal(err.message, 'meow is required');
      setTimeout(assert.end, timeout);
    });
  });

  test('shared/subscribe/message:pipe', function(assert) {
    var i = 0;
    sub.on('message', function() {
      if (i === 1) {
        assert.pass('got two messages');
        assert.end();
      }
      i++;
    });
    sub.once('error', assert.fail);
    fs.createReadStream(path.join(__dirname, '../../fixtures/files/stream.txt'))
      .pipe(channel);
    //setTimeout(assert.fail, timeout);
  });

  //test('shared/subscribe/message:pipe_error', function(assert) {
  //  sub.once('error', function(err) {
  //    assert.equal(err.message, 'invalid json');
  //    assert.end();
  //  });
  //  sub.once('message', assert.fail);
  //  fs.createReadStream(
  //      path.join(__dirname, '../../fixtures/files/stream.txt'))
  //    .pipe(channel);
  //  setTimeout(assert.fail, timeout);
  //});

  test('teardown', function(assert) {
    pub.close(assert.end);
  });
});
