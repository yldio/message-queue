'use strict';

var debug = require('debug')('mqee/adapters/redis');
var defs = require('./defaults');
var redis = require('redis');

var adapter = {};

//
// defaults
//
adapter.defaults = defs;

//
// publish interfaces
//
adapter.createClient = function(opts) {
  var cli = redis.createClient(opts.port, opts.host, opts.meta);
  cli.on('error', opts.onError || debug);
  return cli;
};

adapter.destroyClient = function(cli) {
  return function(cb) {
    cli.end();
    cb();
  };
};

adapter.whenReady = function() {
  return function onReady(f) {
    return process.nextTick(f);
  };
};

adapter.publish = function(cli) {
  return function(name, chunk, enc, next) {
    cli.publish(name, chunk);
    next();
  };
};

module.exports = {
  Publish: require('../../publish')(adapter),
  Subscribe: 'Subscribe'
};
