'use strict';

var amqpjs        = require('amqpjs');
var uuid          = require('node-uuid');
var EventEmitter  = require('events').EventEmitter;

//
//  same URI we should use the
//  same connection
//  we don't want connection churn
//  and amqp is channel oriented
//

var connections = {};

module.exports = amqp;

function amqp(conf, socketOptions) {
  var uri = amqpjs.formatUri(conf);

  function createChannel() {
    var channel = new EventEmitter();
    channel.id  = uuid.v4();
    channel.ch  = null;

    //
    // close can be called before the channel been created
    //
    channel.close = function(cb) {
      if (channel.ch) {
        channel.ch.close(cb);
      } else {
        channel.toBeClose = true;
        cb();
      }
    };

    connections[uri]._channels[channel.id] = channel;

    connections[uri].createChannel(function(err, ch) {
      if (err) {
        channel.emit('error', err, true);
      } else {
        if (channel.toBeClose) {
          ch.close();
        } else {
          channel.ch = ch;
          channel.emit('connect');
        }

        ch.on('error', function(err) {
          channel.emit('error', err);
        });
        ch.on('close', function() {
          connections[uri].emit('rm_channel', channel.id);
        });
      }
    });

    return channel;
  }

  if (!connections[uri]) {
    connections[uri] = new amqpjs(uri, socketOptions);
    connections[uri]._channels = {};

    //
    // emitted when rm a channel
    // in case don't exist any channel online
    // then close the conn
    //
    connections[uri].on('rm_channel', function(channel) {
      delete connections[uri]._channels[channel];

      if (!Object.keys(connections[uri]._channels).length) {
        connections[uri].close();
        delete connections[uri];
      }
    });

    //
    // send error to the channels and close the channel
    //
    connections[uri].on('error', function(err) {
      Object.keys(connections[uri]._channels)
        .forEach(function(channel) {
          connections[uri]._channels[channel].emit('error', err, true);
          connections[uri]._channels[channel].close();
        });
    });

    //connections[uri].on('close', function() {
    //  debugger
    //});
  }

  return createChannel();
}
