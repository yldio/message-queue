'use strict';

var helpers   = require('../../helpers');

// amqp specific tests

var test = helpers.testFor('amqp', [
  'shared',
  'subscribe',
  'optional_params'
]);

var adapter = require('../../../lib')('amqp');

var pub;
var sub;
var channel = 'cats';
var virtualQueue = new Date().getTime().toString();

test('amqp - set a bad exchange for the Publish', function(assert) {
  pub = new adapter.Publish({exchange: null});
  pub.on('error', function(err) {
    assert.equal(err.message, 'Field \'exchange\' is the wrong type;' +
      ' must be a string (up to 255 chars)');
    pub.close(assert.end);
  });
});

test('amqp - set a bad exchange for the Subscribe', function(assert) {
  sub = new adapter.Subscribe({channel: 'cats', exchange: null});
  sub.on('error', function(err) {
    assert.equal(err.message, 'Field \'exchange\' is the wrong type;' +
      ' must be a string (up to 255 chars)');
    sub.close(assert.end);
  });
});

test('create a subscribe and delete the queue', function(assert) {
  sub = new adapter.Subscribe({
    channel: channel,
    queue: 'felix_1',
    queueOptions: {
      autoDelete: true
    }
  });
  assert.ok(sub);
  sub.on('error', assert.pass);
  sub.on('ready', function() {
    // closing the subscribe so soon will receive
    // a error message from the amqp channel
    setTimeout(function() {
      sub.close(assert.end);
    }, 10);
  });
});

test('create a subscribe and don\'t delete the queue and make it durable',
function(assert) {
  sub = new adapter.Subscribe({
    channel: channel,
    queue: virtualQueue,
    queueOptions: {
      durable: true
    }
  });
  sub.on('error', assert.pass);
  sub.on('ready', function() {
    assert.equal(virtualQueue, sub.cli.queue);
    sub.close(assert.end);
  });
});

test('try to create an existente queue and change one of the options',
function(assert) {
  sub = new adapter.Subscribe({
    channel: 'loco',
    queue: virtualQueue,
    queueOptions: {
      autoDelete: true
    }
  });
  sub.on('error', function(err) {
    assert.pass(err);
  });
  sub.on('end', assert.end);
});

test('create a durable queue & get the name/id of the queue',
function(assert) {
  sub = new adapter.Subscribe({
    channel: channel,
    queue: 'felix_queue',
    queueOptions: {
      durable: true
    }
  });
  sub.on('error', assert.fail);
  sub.on('ready', function() {
    // get queue name
    assert.pass('queue: ' + sub.cli.queue);
    assert.end();
  });
});

test('send some messages to persistente in the `felix_queue`',
function(assert) {
  sub.on('message', function(data) {
    assert.equal(typeof data, 'object');
    assert.pass('rx: ' + data.message + ' - ' + data.tmx);
    assert.end();
  });

  pub = new adapter.Publish();
  pub.on('error', assert.fail);
  pub.on('ready', function() {
    channel = pub.channel(channel);
    channel.on('error', assert.fail);
    assert.pass('send message...');
    channel.publish({
      message: 'Hello World!',
      tmx: new Date().getTime().toString()
    }, function(err, ack) {
      assert.deepEqual(err, undefined);
      assert.equal(typeof ack, 'object');
    });
  });
});

test('teardown', function(assert) {
  pub.close(function() {
    sub.close(assert.end);
  });
});
