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

  function removeAllListeners() {
    sub.removeAllListeners('message');
    sub.removeAllListeners('error');
  }

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
    sub.on('message', function(data) {
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
    removeAllListeners();
    var meow = {meow: 'wow'};
    sub.on('message', function(data) {
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
    removeAllListeners();
    var bark = {bark: true};
    sub.on('message', assert.fail);
    dogs.publish(bark, function(err, info) {
      assert.equal(err, undefined);
      assert.deepEqual(JSON.parse(info.written), bark);
      setTimeout(assert.end, timeout);
    });
  });

  test('shared/subscribe/message:bad_schema', function(assert) {
    removeAllListeners();
    var meow = {woof: true};
    sub.on('message', assert.fail);
    channel.publish(meow, function(err) {
      assert.equal(err.message, 'meow is required');
      setTimeout(assert.end, timeout);
    });
  });

  test('shared/subscribe/message:pipe:json', function(assert) {
    removeAllListeners();
    var i = 0;
    sub.on('message', function() {
      if (i === 1) {
        assert.pass('got two messages');
        assert.end();
      }
      i++;
    });
    sub.on('error', assert.fail);
    fs.createReadStream(path.join(__dirname, '../../fixtures/files/stream.txt'))
      .pipe(channel);
    setTimeout(function() {
      if (! assert.ended) {
        assert.fail('test should ended');
      }
    }, timeout);
  });

  test('shared/subscribe/message:pipe_error', function(assert) {
    removeAllListeners();
    pub.on('error', function(err) {
      assert.pass('should return a error message: ' + err); 
      assert.end();
    });
    fs.createReadStream(
        path.join(__dirname, '../../fixtures/files/bad_schema.txt'))
      .pipe(channel);
    setTimeout(function() {
      if (! assert.ended) {
        assert.fail('test should ended');
      }  
    }, timeout);
  });

  test('teardown', function(assert) {
    pub.close(assert.end);
  });
});
