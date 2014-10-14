'use strict';

var defaults  = require('./defaults');
var amqplib   = require('amqplib/callback_api');
var format    = require('util').format;
var async     = require('async');

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

function amqpConnect(cli) {
  return function(cb) {
    function connectCb(err, conn) {
      debugger
      if (err) {
        cb(err);
      } else {
        cli.amqpConn = conn;
        cli.amqpConn.on('error', cli.onError);
        cb();
      }
    }
    amqplib.connect(cli.uri, cli.socketOptions, connectCb);
  };
}

function amqpChannel(cli) {
  return function(cb) {
    function createChannelCb(err, channel) {
      debugger
      if (err) {
        cb(err);
      } else {
        cli.amqpChannel = channel;
        cli.amqpChannel.assertExchange(
          cli.exchange,
          cli.exchangeType,
          cli.exchangeOptions);

        cli.amqpChannel.on('error', cli.onError);
        cb();
      }
    }
    cli.amqpConn.createChannel(createChannelCb);
  };
}

//
// AMQP adapter
//

var adapter = {
  name      : 'amqp',
  defaults  : defaults,
  publish   : {},
  subscribe : {}
};

//
// publish interfaces
//
adapter.publish.createClient = function(opts) {
  var cli             = {};
  cli.uri             = amqpURI(opts);
  cli.socketOptions   = opts.meta.socketOptions;
  cli.exchange        = opts.meta.exchange;
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
    if (cli.amqpChannel && cli.amqpConn) {
      cli.amqpChannel.close(function() {
        cli.amqpConn.close(cb);
      });
    } else {
      cb();
    }
  };
};

adapter.publish.onReady         = amqpConnect;
adapter.publish.prepareChannels = amqpChannel;

adapter.publish.publish = function(cli) {
  return function(routingKey, chunk, next) {
    function publishCb() {
      cli.amqpChannel.publish(
        cli.exchange,
        routingKey,
        chunk);

      next();
    }
    setImmediate(publishCb);
  };
};

//
// subscribe interfaces
//
adapter.subscribe.createClient  = adapter.publish.createClient;
adapter.subscribe.destroyClient = adapter.publish.destroyClient;

adapter.subscribe.onReady = function(cli) {
  return function(cb) {
    async.series([
      amqpConnect(cli),
      amqpChannel(cli)
    ], cb);
  };
};

adapter.subscribe.subscribe = function(cli) {
  return function(cb) {
    cli = cli;
    cb();
  };
};

module.exports = {
  Publish: require('../../publish')(adapter),
  Subscribe: require('../../subscribe')(adapter)
};
