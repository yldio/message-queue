'use strict';

var defs = require('./defaults');
var redis = require('redis');

var adapter = {
  name: 'redis',
  defaults: defs
};

//
// publish interfaces
//
adapter.createClient = function(opts) {
  var cli = redis.createClient(opts.port, opts.host, opts.meta);
  cli.on('error', opts.onError);
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
