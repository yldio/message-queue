'use strict';

var os            = require('os');
var inherits      = require('util').inherits;
var EventEmitter  = require('events').EventEmitter;
var Netcat        = require('node-netcat');


module.exports = Subscribe;


function Subscribe(port, host, options) {
  if (!(this instanceof Subscribe)) {
    return new Subscribe(port, host, options);
  }

  EventEmitter.call(this);
  Subscribe.init.call(this, port, host, options);
}

inherits(Subscribe, EventEmitter);

Subscribe.init = function(port, host, options) {
  var self  = this;
  port      = port || 6000;
  host      = host || 'localhost';

  self._client = Netcat.client(port, host,
    { timeout: (options && options.timeout) || 3600000 });
  

};
