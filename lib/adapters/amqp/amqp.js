'use strict';

var amqpjs        = require('/vagrant/amqpjs');
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

    connections[uri]._channel[channel.id] = 1;

    connections[uri].createChannel(function(err, ch) {
      if (err) {
        // closed then omit the error
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
            connections[uri].emit('rm_client', channel.id);
          });

          ch.on('error', function(_err) {
            channel.emit('error', _err);
          });
        }
      }
    });

    channel.on('ch_was_closed', function() {
      channel._chWasClosed = true;
      connections[uri].emit('rm_client', channel.id);
    });

    return channel;
  }

  if (!connections[uri]) {
    connections[uri] = new amqpjs(uri, socketOptions);
    connections[uri]._clients = {};
    //
    // emiter when rm a channel
    // check exist any channel online
    // dosen't exist the close the conn
    //
    connections[uri].on('rm_client', function(clientId) {
      delete connections[uri]._clients[clientId];
      connections[uri].close();
      delete connections[uri];
    });
  }

  return createChannel();
}
