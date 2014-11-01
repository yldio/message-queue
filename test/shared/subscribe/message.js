'use strict';

var fs        = require('fs');
var helpers   = require('../../helpers');
var adapters  = helpers.adapters;
var timeout   = helpers.timeout;

var validateMeow    = helpers.readFixture('topics/meow.js');
var streamPath      = helpers.fixturePath('files/stream.txt');
var oneBadApple     = helpers.fixturePath('files/badapple.txt');
var plainStreamPath = helpers.fixturePath('files/plainstream.txt');

adapters.forEach(function(adapterName) {
  var test = helpers.testFor(adapterName, ['shared', 'subscribe', 'message']);
  var adapter = require('../../../lib')(adapterName);

  var sub     = null;
  var pub     = null;
  var channel = null;
  var dogs    = null;

  function removeAllListeners() {
    sub.removeAllListeners('message');
    sub.removeAllListeners('error');
    sub.removeAllListeners('ready');
    channel.removeAllListeners('error');
  }

  test('publisher should be `ready`', function(assert) {
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

  test('should be able to subscribe to cats', function(assert) {
    sub = new adapter.Subscribe({
      channel: 'cats',
      json: false
    });
    sub.on('ready', function() {
      assert.ok(sub);
      assert.equal(sub.channel, 'cats');
      assert.end();
    });
  });

  test('should be able to publish a meow', function(assert) {
    removeAllListeners();
    var meow = {meow: 'wow'};
    sub.on('message', function(data) {
      debugger
      assert.notDeepEqual(data, meow);
      assert.deepEqual(typeof data, 'string');
      //
      // recreate the subscriber in the next test
      //
      sub.close(assert.end);
    });
    sub.on('error', function(err) {
      debugger
    });
    channel.publish(meow, function(err, info) {
      debugger
      assert.equal(err, undefined);
      assert.deepEqual(JSON.parse(info.written), meow);
    });
  });
return;
  test('should be able to subscribe to json cats', function(assert) {
    debugger
    sub = new adapter.Subscribe({
      channel: 'cats'
    });
    sub.on('ready', function() {
      assert.ok(sub);
      assert.equal(sub.channel, 'cats');
      assert.end();
    });
  });

  test('should be able to publish a json meow', function(assert) {
    var meow = {meow: 'wow'};
    debugger
    sub.on('message', function(data) { 
      assert.deepEqual(data, meow);
      assert.deepEqual(typeof data, 'object');
      assert.end();
    });
    channel.publish(meow, function(err, info) { 
      assert.equal(err, undefined);
      assert.deepEqual(JSON.parse(info.written), meow);
    });
  });

  test('should raise error when json parse fails', function(assert) {
    debugger
    removeAllListeners();
    var fail = '{{notjson}}';
    var dogSub = new adapter.Subscribe({
      channel: 'dogs',
      json: true
    });
    dogSub.on('ready', function() {
      assert.ok(dogSub);
      assert.equal(dogSub.channel, 'dogs');
      dogSub.on('error', function(err) {
        assert.equal(err.message, 'Not valid json {{notjson}}');
        dogSub.close(assert.end);
      });
      dogs.publish(fail, function(err, info) {
        assert.equal(err, undefined);
        assert.equal(info.written, fail);
      });
    });
  });

  test('shouldnt listen on the wrong channel', function(assert) {
    removeAllListeners();
    var bark = {bark: true};
    sub.on('message', assert.fail);
    dogs.publish(bark, function(err, info) {
      assert.equal(err, undefined);
      assert.deepEqual(JSON.parse(info.written), bark);
      setTimeout(assert.end, timeout);
    });
  });

  test('shouldnt get message when validation fails', function(assert) {
    removeAllListeners();
    var meow = {woof: true};
    sub.on('message', assert.fail);
    channel.publish(meow, function(err) {
      assert.equal(err.message, 'ValidationError: meow is required');
      setTimeout(assert.end, timeout);
    });
  });

  test('should allow piping', function(assert) {
    removeAllListeners();
    var i = 0;
    sub.on('message', function(message) {
      assert.ok(message.meow);
      if (i === 1) {
        assert.pass('got two messages');
        assert.end();
      }
      i++;
    });
    sub.on('error', assert.fail);
    fs.createReadStream(streamPath)
      .pipe(channel);
    channel.on('error', assert.fail);
    setTimeout(function() {
      if (!assert.ended) {
        assert.fail('test should ended');
      }
    }, timeout);
  });

  test('should raise error if pipe has json error', function(assert) {
    removeAllListeners();
    var i = 0;
    channel.on('error', function(err) {
      if (i !== 0) {
        return;
      }
      assert.pass('should return a error message: ' + err);
      assert.end();
      i++;
    });
    fs.createReadStream(plainStreamPath)
      .pipe(channel);
    setTimeout(function() {
      if (!assert.ended) {
        assert.fail('test should ended');
      }
    }, timeout);
  });

  test('should raise error if validation fails on pipe', function(assert) {
    removeAllListeners();
    channel.on('error', function(err) {
      assert.pass('should return a error message: ' + err);
      assert.end();
    });

    fs.createReadStream(oneBadApple)
      .pipe(channel);
    setTimeout(function() {
      if (!assert.ended) {
        assert.fail('test should ended');
      }
    }, timeout);
  });

  test('teardown', function(assert) {
    pub.close(function() {
      sub.close(assert.end);
    });
  });
});
