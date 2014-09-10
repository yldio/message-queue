'use strict';

var os            = require('os');
var inherits      = require('util').inherits;
var EventEmitter  = require('events').EventEmitter;
var Netcat        = require('node-netcat');
var Joi           = require('joi');


module.exports = Publish;

function Publish(options) {
  if (!(this instanceof Publish)) {
    return new Publish(options);
  }

  EventEmitter.call(this);
  Publish.init.call(this, options);
}

inherits(Publish, EventEmitter);

Publish.init = function (options) {
  var self        = this;
  var port        = options && options.port || 6000;
  var host        = options && options.host || 'localhost';
  var timeout     = options && options.timeout || 3600000;
  self._channels  = {};
  self._ready     = false;

  self._server = new Netcat.server(port, host, timeout);

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
    self._channels[channel].forEach(function(client) {
      self._server.send(client, JSON.stringify(message) + os.EOL, false, cb);
    });
  }

  // server events
  self._server.once('ready', ready);
  self._server.on('data', subscribe);
  self._server.on('client_off', unSubscribe);
  self._server.on('error', error);
  self._server.once('close', end);
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

  return this._server.close();
};

Publish.prototype.channel = function(channel, topic) {
  var self = this;
  var _channel = channel;
  var _topic = topic;

  if (!self._channels[_channel]) {
    self._channels[_channel] = [];
  }

  return {
    write: function(message, cb) {
      cb = cb || function() {};

      if (!self._ready) {
        return cb(new Error('Publish not ready!'));
      }

      Joi.validate(message, _topic, function(err) {
        if (err) {
          return cb(err);
        }
        self.emit('new_msg', _channel, message, cb);
      });
    }
  };
};
