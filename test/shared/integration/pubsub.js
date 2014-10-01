'use strict';

var helpers = require('../../helpers');
var adapters = helpers.adapters;

adapters.forEach(function(adapterName) {
  var test = helpers.testFor(adapterName, ['shared', 'integration', 'pubsub']);
  var adapter = require('../../../lib/mqee')(adapterName);

  test('should be able to publish on same tick as `ready`', function(assert) {
    var pub;
    var sub = new adapter.Subscribe({channel: 'cats', json: false});

    sub.on('ready', function() {
      pub = new adapter.Publish();

      pub.on('ready', function(err) {
        assert.equal(err, undefined);
        var channel = pub.channel('cats');
        channel.publish('meow', function(err) {
          assert.equal(err, undefined);
        });
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
        assert.end();
      }
      pub.close();
      sub.close();
    }, 500);
  });

  test('able to receive messages without `sub#ready`', function(assert) {
    var pub = new adapter.Publish();
    var sub;
    var i = 0;

    pub.on('ready', function(err) {
      sub = new adapter.Subscribe({channel: 'cats', json: false});

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

      assert.equal(err, undefined);

      var channel = pub.channel('cats');

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

});
