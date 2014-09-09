'use strict';

var EventEmitter = require('events').EventEmitter;
var defs = require('./defaults');

module.exports = {
  Publish: Publish
};

function Publish(opts) {
  opts = opts || {};
  var emitter = new EventEmitter();

  emitter.port = +(opts.port || defs.port);
  emitter.host = opts.host || defs.host;

  delete opts.port;
  delete opts.host;

  emitter.meta = opts;

  return emitter;
}

Publish.defaults = defs;
