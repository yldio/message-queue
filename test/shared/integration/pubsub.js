'use strict';

var fs        = require('fs');
var helpers   = require('../../helpers');
var adapters  = helpers.adapters;
var timeout   = helpers.timeout;

var validateMeow    = helpers.readFixture('topics/meow.js');
var oneBadApple     = helpers.fixturePath('files/badapple.txt');
var plainStreamPath = helpers.fixturePath('files/plainstream.txt');
var plainContents   = helpers.readFixture('files/plainstream.txt');

adapters.forEach(function(adapterName) {
  var lines = plainContents
    .split('\n')
    .filter(function(e) { return !!e; })
    .length;

  var test = helpers.testFor(adapterName, ['shared', 'integration', 'pubsub']);
  var adapter = require('../../../lib')(adapterName);

  test('should be able to publish on same tick as `ready`', function(assert) {
    var pub;
    var sub = new adapter.Subscribe({channel: 'cats', json: false});

    function errorCb(err) {
      assert.fail(err);
    }

    sub.on('error', errorCb);

    sub.on('ready', function() {
      pub = new adapter.Publish();
      pub.on('error', errorCb);

      pub.on('ready', function() {
        var channel = pub.channel('cats');
        channel.on('error', errorCb);
        channel.publish('meow');
      });

      sub.on('message', function() {
        assert.pass('Got the message');
        pub.close();
        sub.close(assert.end);
      });
    });

    setTimeout(function() {
      if (!assert.ended) {
        assert.fail('timed out');
        pub.close();
        sub.close();
        assert.end();
      }
    }, 5000);
  });

  test('able to receive messages without `sub#ready`', function(assert) {
    var pub = new adapter.Publish();
    var sub;
    var i = 0;

    function errorCb(err) {
      assert.fail(err);
    }

    pub.on('error', errorCb);

    pub.on('ready', function() {
      sub = new adapter.Subscribe({channel: 'cats', json: false});
      sub.on('error', errorCb);

      sub.on('message', function() {
        i++;
        assert[i === 1 ? 'pass' : 'fail']('Got ' + i + ' message');
        //
        // end after 100ms
        //
        setTimeout(function() {
          assert.end();
          pub.close();
          sub.close();
        }, 100);
      });

      var channel = pub.channel('cats');
      channel.on('error', errorCb);

      //
      // should not be intercepted because we were not listening
      //
      channel.publish('woof', function(err) {
        assert.equal(err, undefined);
      });

      setTimeout(function() {
        //
        // should now be ready
        //
        channel.publish('meow', function(err) {
          assert.equal(err, undefined);
        });
      }, 500);
    });
  });

  test('should be able to buffer publishes before ready with callback',
  function(assert) {
    var sub = new adapter.Subscribe({channel: 'cats', json: false});
    var pub;

    //
    // listening
    //
    sub.on('ready', function() {
      pub = new adapter.Publish();
      var channel = pub.channel('cats');
      //
      // not connected at this point
      //
      // message should be buffered and sent
      // when ready
      //
      channel.publish('woof', function(err) {
        assert.equal(err, undefined);
      });
    });

    sub.on('error', assert.fail);
    sub.on('message', function(msg) {
      assert.equal(msg, 'woof');
      pub.close();
      sub.close();
      assert.end();
    });
  });

  test('should be able to buffer publishes before ready without callback',
  function(assert) {
    var sub = new adapter.Subscribe({channel: 'cats', json: false});
    var pub;

    //
    // listening
    //
    sub.on('ready', function() {
      pub = new adapter.Publish();
      var channel = pub.channel('cats');
      //
      // not connected at this point
      //
      // message should be buffered and sent
      // when ready
      //
      channel.publish('woof');
    });

    sub.on('error', assert.fail);
    sub.on('message', function(msg) {
      assert.equal(msg, 'woof');
      pub.close();
      sub.close();
      assert.end();
    });
  });

  test('should be able to pipe plaintext', function(assert) {
    var pub;
    var sub = new adapter.Subscribe({channel: 'cats', json: false});

    function errorCb(err) {
      assert.fail(err);
    }

    sub.on('error', errorCb);

    sub.on('ready', function() {
      pub = new adapter.Publish();
      pub.on('error', errorCb);

      pub.on('ready', function() {
        var channel = pub.channel('cats', {json: false});
        channel.on('error', errorCb);
        fs.createReadStream(plainStreamPath).pipe(channel);
        setTimeout(function() {
          if (!assert.ended) {
            assert.fail('test should ended');
          }
        }, timeout);
      });

      sub.on('message', function(msg) {
        assert.pass('Got the message: ' + msg);
        if (--lines === 0) {
          pub.close();
          sub.close(assert.end);
        }
      });
    });
  });

  test('should filter elements not in the schema', function(assert) {
    var pub;
    var sub = new adapter.Subscribe({channel: 'cats'});

    sub.on('ready', function() {
      pub = new adapter.Publish();

      var channel = pub.channel('cats', {
        schema: validateMeow
      });
      channel.on('error', function(err) {
        assert.equal(err.message, 'ValidationError: meow is required');
      });
      fs.createReadStream(oneBadApple).pipe(channel);
      setTimeout(function() {
        pub.close();
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
