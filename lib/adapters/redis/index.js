'use strict';

var defaults = require('./defaults');
var redis = require('redis');

var adapter = {
  name: 'redis',
  defaults: defaults,
  publish: {},
  subscribe: {}
};

//
// publish interfaces
//
adapter.publish.createClient = function(opts) {
  var cli = redis.createClient(opts.port, opts.host, opts.meta);
  cli.on('error', opts.onError);
  return cli;
};

adapter.publish.destroyClient = function(cli) {
  return function(cb) {
    cli.end();
    cb();
  };
};

adapter.publish.onReady = function() {
  return function(f) {
    process.nextTick(f);
  };
};

adapter.publish.publish = function(cli) {
  return function(name, chunk, enc, next) {
    process.nextTick(function() {
      cli.publish(name, chunk);
      next();
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
