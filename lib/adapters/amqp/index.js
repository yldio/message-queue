'use strict';

var defaults = require('./defaults');
var url = require('url');
var async = require('async');
var extend = require('xtend');
var amqp = require('amqplib/callback_api');

var adapter = {
  name: 'amqp',
  defaults: defaults,
  publish: {},
  subscribe: {}
};

//
// publish interfaces
//
adapter.publish.createClient = function(opts) {
  return opts;
};

adapter.publish.destroyClient = function(cli) {
  return function(cb) {
    //
    // people might try to delete the connection
    // before the connection being ready
    //
    // we need to check if things are defined
    //
    async.each(['channel', 'connection'], function close(elem, next) {
      elem = cli[elem];
      if (elem) {
        elem.close(next);
      } else {
        next();
      }
    }, function() {
      cb();
    });
  };
};

adapter.publish.onReady = function(cli) {
  return function(callback) {
    cli.meta.url = url.format({
      protocol: 'amqp',
      slashes: true,
      host: cli.meta.host,
      port: cli.meta.port,
      auth: cli.meta.user && cli.meta.pass ?
        (cli.meta.user + ':' + cli.meta.pass) :
        null
    });

    amqp.connect(cli.meta.url, connected);

    function connected(err, conn) {
      if (err) {
        callback(err);
      } else {
        conn.on('error', cli.onError);
        cli.connection = conn;
        conn.createConfirmChannel(channelCreated);
      }
    }

    function channelCreated(err, channel) {
      if (err) {
        callback(err);
      } else {
        channel.on('error', cli.onError);
        cli.channel = channel;
        channel.assertExchange(cli.meta.exchange.name,
          cli.meta.exchange.type, cli.meta.exchange, callback);
      }
    }
  };
};

adapter.publish.prepareChannels = function(cli) {
  function assertQueue(queue, cb) {
    cli.channel.assertQueue(queue, cli.meta.queue, cb);
  }

  return function(cb) {
    if (!cli.meta.channels) {
      return cb(new Error('You need to specify the channels to subscribe to'));
    }
    var queueNames = Object.keys(cli.meta.channels);
    async.each(queueNames, assertQueue, cb);
  };
};

adapter.publish.publish = function(cli) {
  return function(channelName, chunk, enc, next) {
    process.nextTick(function() {
      var queue = cli.meta.channels[channelName];
      if (!queue) {
        return next(new Error('Unknown channel ' + channelName));
      }

      var publishOptions = extend({}, cli.meta.publish);

      cli.channel.publish(cli.meta.exchange.name,
        channelName,
        chunk,
        publishOptions,
        next);
    });
  };
};

//
// subscribe interfaces
//
adapter.subscribe.createClient = adapter.publish.createClient;
adapter.subscribe.destroyClient = adapter.publish.destroyClient;
adapter.subscribe.onReady = function(cli) {
  return function(cb) {
    cli.subscribe(cli.channel);
    cli.on('subscribe', function(channel) {
      cb(null, channel);
    });
  };
};

adapter.subscribe.subscribe = function(cli) {
  return function onMessage(cb) {
    cli.on('message', function(channel, message) {
      if (channel === cli.channel) {
        cb(null, message);
      }
    });
  };
};

module.exports = {
  Publish: require('../../publish')(adapter),
  Subscribe: require('../../subscribe')(adapter)
};
