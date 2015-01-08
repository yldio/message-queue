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

function amqp(uri, socketOptions) {
  function createChannel() {
    var channel  = new EventEmitter();
    channel.id   = uuid.v4();

    //
    // we need a way to be inform when
    // the conn/channel was closed too early
    //
    channel._chWasClosed   = false;

    connections[uri]._channels[channel.id] = 1;

    connections[uri].createChannel(function(err, ch) {
      if (err) {
        // the channel was closed too early then omit the error
        if (!channel._chWasClosed) {
          channel.emit('error', err);
        }
      } else {
        if (channel._chWasClosed) {
          ch.close();
        } else {
          channel.ch = ch;
          channel.emit('connect');

          ch.on('close', function() {
            connections[uri].emit('rm_channel', channel.id);
          });

          ch.on('error', function(_err) {
            channel.emit('error', _err);
          });
        }
      }
    });

    channel.on('ch_was_closed', function() {
      channel._chWasClosed = true;
      connections[uri].emit('rm_channel', channel.id);
    });

    return channel;
  }

  if (!connections[uri]) {
    connections[uri] = new amqpjs(uri, socketOptions);
    connections[uri]._channels = {};

    //
    // emiter when rm a channel
    // check if exist any channel online
    // to close the conn & release de resource
    //
    connections[uri].on('rm_channel', function(channelId) {
      delete connections[uri]._channels[channelId];

      if (!Object.keys(connections[uri]._channels).length) {
        connections[uri].close();
        delete connections[uri];
      }
    });

    // ??????
    connections[uri].on('error', function(err) {
      throw err;
    });

    connections[uri].on('close', function() {
    });
  }

  return createChannel();
}
