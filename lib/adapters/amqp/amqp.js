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

function amqp(conf, socketOptions, fnError) {
  var uri = amqpjs.formatUri(conf);

  function createChannel() {
    var channel = new EventEmitter();
    channel.id  = uuid.v4();
    channel.ch  = null;
    channel.onError = fnError;

    channel.close = function(cb) {
      if (channel.ch) {
        channel.ch.close(cb);
      } else {
        channel.toBeClose = true;
        cb();
      }
    };

    connections[uri]._channels[channel.id] = channel;
    connections[uri].on('error', fnError);

    connections[uri].createChannel(function(err, ch) {
      if (err) {
        fnError(err);
      } else {
        if (channel.toBeClose) {
          ch.close();
        } else {
          channel.ch = ch;
          channel.emit('connect');
        }

        ch.on('error', fnError);
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
    connections[uri].on('rm_channel', function(channelId) {
      delete connections[uri]._channels[channelId];

      if (!Object.keys(connections[uri]._channels).length) {
        connections[uri].close();
        delete connections[uri];
      }
    });

    //connections[uri].on('close', function() {
    //});
  }

  return createChannel();
}
