'use strict';

var defaults  = require('./defaults');
var redis     = require('redis');

var adapter = {
  name      : 'redis',
  defaults  : defaults,
  publish   : {},
  subscribe : {}
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

adapter.publish.onReady = function(cli) {
  return function(cb) {
    cli.on('connect', cb);
  };
};

adapter.publish.prepareChannels = function() {
  return function(cb) { process.nextTick(cb); };
};

adapter.publish.publish = function(cli) {
  return function(name, chunk, cb) {
    //
    //  two ways to be used:
    //  call callback => when the data is finally written out
    //  return a bool =>
    //    true if the entire data was
    //      flushed successfully
    //      to the kernel buffer
    //    false if all or part of the
    //      data was queued in user memory
    //
    setImmediate(function() {
      if (cb) {
        cli.publish([name, chunk], cb);
      } else {
        cli.publish(name, chunk);
      }
    });
  };
};

//
// subscribe interfaces
//
adapter.subscribe.createClient  = adapter.publish.createClient;
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
  return function(cb) {
    cli.on('message', function(channel, message) {
      cb(message);
    });
  };
};

module.exports = {
  Publish: require('../../publish')(adapter),
  Subscribe: require('../../subscribe')(adapter)
};
