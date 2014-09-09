'use strict';

var inherits      = require('util').inherits;
var EventEmitter  = require('events').EventEmitter;
var Netcat        = require('node-netcat');

module.exports = Subscribe;

function Subscribe(options) {
  if (!(this instanceof Subscribe)) {
    return new Subscribe(options);
  }

  EventEmitter.call(this);
  Subscribe.init.call(this, options);
}

inherits(Subscribe, EventEmitter);

Subscribe.init = function(options) {
  var self    = this;
  var port    = options && options.port || 6000;
  var host    = options && options.host || 'localhost';
  var timeout = options && options.timeout || 3600000;

  self._client = Netcat.client(port, host, timeout);

};

Subscribe.prototype.close = function() {
  return this._client.send(null, true);
};
