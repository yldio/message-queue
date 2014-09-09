'use strict';

var test = require('tape');
var fs = require('fs');
var path = require('path');
var split = require('split');
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
      channel = pub.channel('cats', {
        schema: validateMeow,
        format: 'json'
      });
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

  test('shared/subscribe/message:pipe', function(assert) {
    var meow = {woof: true};
    var i = 0;
    sub.on('message', function () {
      if (i === 1) {
        assert.pass('got two messages');
        assert.end();
      }
      i++;
    });
    sub.on('error', assert.fail);
    fs.createReadStream(
        path.join(__dirname, '../../fixtures/files/stream.txt'))
      .pipe(split())
      .pipe(channel);
    setTimeout(assert.fail, timeout);
  });

  test('shared/subscribe/message:pipe_error', function(assert) {
    var meow = {woof: true};
    sub.on('error', function (error) {
      assert.equal(err.message, 'invalid json');
      assert.end();
    });
    sub.on('message', assert.fail);
    fs.createReadStream(
        path.join(__dirname, '../../fixtures/files/stream.txt'))
      .pipe(channel);
    setTimeout(assert.fail, timeout);
  });

  test('teardown', function(assert) {
    pub.close(assert.end);
  });
});
