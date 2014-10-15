'use strict';

var amqplib   = require('amqplib/callback_api');
var defaults  = require('./defaults');
var format    = require('util').format;
var async     = require('async');

//
// should reuse the same connection
// and creates differents AMQP channels
//
var connection;

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

//
// creates connection to RabbitMQ only onces
// use ´connection.connection´ to verify if
// the connection was made
//
function amqpConnect(cli) {
  return function(cb) {
    function connectCb(err, conn) {
      if (err) {
        cb(err);
      } else {
        connection = conn;
        connection.on('error', cli.onError);
        cb();
      }
    }

    if (connection && connection.connection) {
      cb();
    } else {
      amqplib.connect(cli.uri, cli.socketOptions, connectCb);
    }
  };
}

function amqpChannel(cli) {
  return function(cb) {
    function createChannelCb(err, channel) {
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
    connection.createChannel(createChannelCb);
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
  cli.queueOptions    = opts.meta.queueOptions;
  cli.onError         = opts.onError;
  return cli;
};

//
// should close first the channel then the conn
//
adapter.publish.destroyClient = function(cli) {
  return function(cb) {
    debugger
    if (cli.amqpChannel && cli.amqpChannel.ch) {
      debugger
      cli.amqpChannel.close(function() {
        debugger
        cb();  
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
    function sub(err) {
      if (err) {
        cb(err);
      } else {
        cli.amqpChannel.bindQueue(
          cli.channel,
          cli.exchange,
          cli.channel,
          {},
          sub);
      }
    }

    function consumeCb(err) {
      if (err) {
        cb(err);
      } else {
        sub();
      }
    }

    function messageCb(msg) {
      cb(null, msg.content.toString());
      // msg.fields.routingKey,
      // msg.content.toString()
    }

    cli.amqpChannel.consume(
      cli.channel,
      messageCb,
      cli.queueOptions,
      consumeCb
    );
  };
};

module.exports = {
  Publish: require('../../publish')(adapter),
  Subscribe: require('../../subscribe')(adapter)
};
