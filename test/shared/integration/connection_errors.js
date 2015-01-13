'use strict';

var execFile  = require('child_process').execFile;
var join      = require('path').join;
var helpers   = require('../../helpers');
var adapters  = helpers.adapters;

var restart = join(__dirname, '../..', 'helpers/restart_server.sh');

function cbForOnReady(adapter, assert) {
  return function() {
    function res(error) {
      if (error) {
        assert.fail(error);
      }
    }

    assert.ok(restart);
    assert.pass('restart "' + adapter + '" server ...');
    execFile(restart, [adapter], res);
  };
}

function cbForOnError(assert) {
  return function(err) {
    assert.deepEqual(err instanceof Error, true);
    setTimeout(assert.end, 5000);
  };
}

adapters.forEach(function(adapterName) {
  var test = helpers.testFor(adapterName, [
    'shared',
    'integration',
    'connection_errors'
  ]);
  var adapter = require('../../../lib')(adapterName);

  var pub;
  var sub;

  test('close a Publish twice', function(assert) {
    pub = new adapter.Publish();
    pub.on('ready', function() {
      assert.ok(true, 'ok');
      pub.close(function() {
        pub.close(assert.end);
      });
    });
  });

  //
  // in the doc we should have the different between
  // `unexpected closed connection` in the publish
  // & the `close connection` in the channel
  //
  test('an unexpected closed connection in the Publish', function(assert) {
    // for now let's ignore Redis
    if ('redis' === adapterName) {
      assert.end();
    } else {
      pub = new adapter.Publish();
      pub.on('error', cbForOnError(assert));
      // lets restart rabbitmq :)
      pub.on('ready', cbForOnReady(adapterName, assert));
    }
  });

  //
  // in the channel_errors we already cover the
  // unexpected closed connection` & the `close connection` for the Subscribe
  // but is better to have both cases in this test
  //
  test('an unexpected closed connection in the Subscribe', function(assert) {
    // for now let's ignore Redis
    if ('redis' === adapterName) {
      assert.end();
    } else {
      sub = new adapter.Subscribe({channel: 'cats'});
      sub.on('error', cbForOnError(assert));
      // lets restart rabbitmq :)
      sub.on('ready', cbForOnReady(adapterName, assert));
    }
  });

  test('teardown', function(assert) { assert.end(); });
});
