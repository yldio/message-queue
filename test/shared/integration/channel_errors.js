'use strict';

var helpers = require('../../helpers');
var adapters = helpers.adapters;
var timeout = helpers.timeout;

var validateMeow = helpers.readFixture('topics/meow.js');

adapters.forEach(function(adapterName) {
  var test = helpers.testFor(adapterName,
    ['shared', 'integration', 'channel_errors']);
  var adapter = require('../../../lib')(adapterName);

  test('should filter elements not in the schema', function(assert) {
    var pub;
    var sub = new adapter.Subscribe({channel: 'cats'});

    sub.on('ready', function() {
      pub = new adapter.Publish();

      var channel = pub.channel('cats', {
        schema: validateMeow
      });

      //
      // validation error
      //
      channel.on('error', function(err) {
        debugger
        assert.equal(err.message, 'meow is required');
      });

      var messages = [
        {meow: 'ok'},
        {woof: 'not'},
        {meow: 'yeah', but: 'no'}
      ];

      var timer = setInterval(function () {
        channel.publish(messages.pop());
        if (!pub.closed) {
          //
          // send one message and closes the publisher
          //
          pub.close();
        }
      }, 100);

      setTimeout(function() {
        clearInterval(timer);
        sub.close(assert.end);
      }, timeout);

      sub.on('message', function(msg) {
        assert.ok(msg.meow, msg.meow);
        assert.equal(msg.but, undefined);
        assert.deepEqual(Object.keys(msg), ['meow'], 'was filtered');
      });

    });
  });

});
