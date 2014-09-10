'use strict';

var Readable      = require('stream').Readable;
var os            = require('os');
var inherits      = require('util').inherits;
var EventEmitter  = require('events').EventEmitter;
var Netcat        = require('node-netcat');
var split         = require('split-json');


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
  var channel = options && options.channel || 'default';

  self._client = Netcat.client(port, host, timeout);

  function subsChannel() { self._client.send(channel); }

  function error(err) { self.emit('error', err); }

  function data(chunk) {
    // create a readable stream
    var rs = new Readable();
    rs.push(chunk);
    rs.push(null);
    rs.pipe(split(/\n/)).on('data', function(obj) {
      console.log(obj);
      self.emit('message', obj);
    });
  }

  function end() { self.emit('close'); }

  // events
  self._client.on('open', subsChannel);
  self._client.on('data', data);
  self._client.on('error', error);
  self._client.on('end', end);

  self._client.start();
};


Subscribe.prototype.close = function() {
  return this._client.send(null, true);
};

