'use strict';

var os            = require('os');
var util          = require('util');
var EventEmitter  = require('events').EventEmitter;
var Netcat        = require('node-netcat');


function Publish(port, host, options) {
  if (!(this instanceof Publish)) {
    return new Publish(port, host, options);
  }

  EventEmitter.call(this);
  Publish.init.call(this, port, host, options);
}

util.inherits(Publish, EventEmitter);

Publish.init = function (port, host, options) {
  var self        = this;
  port            = port || 5000;
  host            = host || 'localhost';
  self._channels  = {};
  self._ready     = false;

  self._server = new Netcat.server(port, host,
    { timeout: (options && options.timeout) || 3600000 }); 

  function ready() {
    self._ready = true;
    self.emit('ready');
  }

  function subscribe(client, channel) {
    channel = channel.toString().replace(/\r?\n/, '');

    if (!self._channels[channel]) {
      self._channels[channel] = [];
    }
    self._channels[channel].push(client);
  }

  function unSubscribe(client) {
    Object.keys(self._channels).forEach(function(channel) {
      self._channels[channel].splice(client, 1);
    });  
  }

  function error(err) { self.emit('error', err); }

  function end() { self.emit('end'); }

  function processMessages(channel, message, cb) {
    console.log(self._channels[channel], channel, message);
    self._channels[channel].forEach(function(client) {
      self._server.send(client, message + os.EOL, false, cb);
    });
  }

  // server events
  self._server.on('ready', ready);
  this._server.on('data', subscribe);
  self._server.on('client_off', unSubscribe);
  self._server.on('error', error);
  self._server.on('close', end);
  // emit to publish the messages
  self.on('new_msg', processMessages);
  
  self._server.listen();
};

// close the Publisher
// we need to inform the subscribers before close
Publish.prototype.close = function() {
  Object.keys(this._channels).forEach(function(channel) {
    Object.keys(this._channels[channel]).forEach(function(client) {
      this._server.send(client, null, true);
    }, this);
  }, this);

  this._server.close();
};

Publish.prototype.channel = function(channel) {
  var self = this;
  var theChannel = channel;

  if (!self._channels[theChannel]) {
    self._channels[theChannel] = []; 
  }
  
  return {
    write: function(message, cb) {
      cb = cb || function() {};

      if (!self._ready) {
        return cb(new Error('Publish not ready!'));  
      }
      self.emit('new_msg', theChannel, message, cb);
    }
  };
};
