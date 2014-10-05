'use strict';

var defaults = require('./defaults');
var amqplib = require('amqplib/callback_api');
var format = require('util').format;

function amqpURI(opts) {
  return format('%s://%s:%s@%s:%d%s',
    opts.meta.ssl ? 'amqps' : 'amqp',
    opts.meta.user,
    opts.meta.password,
    opts.host,
    opts.port,
    opts.meta.vhost
  );
}

var adapter = {
  name: 'amqp',
  defaults: defaults,
  publish: {},
  subscribe: {}
};

//
// publish interfaces
//
adapter.publish.createClient = function(opts) {
  var cli             = {};
  cli.uri             = amqpURI(opts);
  cli.socketOptions   = opts.meta.socketOptions;
  cli.exchangeName    = opts.meta.exchange;
  cli.exchangeType    = opts.meta.exchangeType;
  cli.exchangeOptions = opts.meta.exchangeOptions;
  cli.onError         = opts.onError;
  return cli;
};

//
// should close first the channel then the conn
//
adapter.publish.destroyClient = function(cli) { 
  return function(cb) { 
    cli.channel.close(function() {
      cli.conn.close(cb);
    });
  };
};

adapter.publish.onReady = function(cli) {
  return function(f) {
    function connectCb(err, conn) {
      if (err) {
        f(err);  
      } else {
        cli.conn = conn;
        cli.conn.on('error', cli.onError);
        f();
      }
    }
    amqplib.connect(cli.uri, cli.socketOptions, connectCb);
  };
};

adapter.publish.prepareChannels = function(cli) {
  return function(f) {
    function createChannelCb(err, channel) {
      if (err) {
        f(err);
      } else {
        channel.assertExchange(
          cli.exchangeName, 
          cli.exchangeType,
          cli.exchangeOptions);
        cli.channel = channel;
        cli.channel.on('error', cli.onError);
        f();
      }
    }
    cli.conn.createChannel(createChannelCb); 
  };
};

adapter.publish.publish = function(cli) {
  return function(routingKey, chunk, next) {
    function publishCb() {
      cli.channel.publish(cli.exchangeName, routingKey, chunk);
      next();
    }
    process.nextTick(publishCb);
  };
};

//
// subscribe interfaces
//
adapter.subscribe.createClient = adapter.publish.createClient;
adapter.subscribe.destroyClient = adapter.publish.destroyClient;
adapter.subscribe.onReady = function(cli) {
  return function(cb) {
    cli.subscribe(cli.channel);
    cli.on('subscribe', function(channel) {
      cb(null, channel);
    });
  };
};

adapter.subscribe.subscribe = function(cli) {
  return function onMessage(cb) {
    cli.on('message', function(channel, message) {
      cb(null, message);
    });
  };
};

module.exports = {
  Publish: require('../../publish')(adapter),
  Subscribe: require('../../subscribe')(adapter)
};
