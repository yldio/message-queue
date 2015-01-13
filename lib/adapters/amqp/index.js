'use strict';

var defaults  = require('./defaults');
var amqp      = require('./amqp');
var extend    = require('xtend');
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
  // port/host exist in opts & opts.meta but we want the values from opts
  var cli = amqp(extend(opts.meta, {
      port: opts.port,
      host: opts.host
    }),
    opts.meta.socketOptions,
    opts.onError);

  //
  //  AMQP options
  //
  cli.opts = {};

  cli.exchange              = opts.meta.exchange;
  cli.opts.exchangeType     = opts.meta.exchangeType;
  cli.opts.exchange         = opts.meta.exchangeOptions;
  cli.opts.queue            = opts.meta.queue;
  cli.opts.queueOptions     = opts.meta.queueOptions;
  cli.opts.consumerOptions  = opts.meta.consumerOptions;
  cli.opts.producerOptions  = opts.meta.producerOptions;

  return cli;
};

adapter.publish.destroyClient = function(cli) {
  return function(cb) {
    cli.close(cb);
  };
};

adapter.publish.onReady = function(cli) {
  return function(cb) {
    cli.on('connect', function() {
      cb();
    });
  };
};

adapter.publish.prepareChannels = function(cli) {
  return function(cb) {
    // I open a issue about this on amqp.node repo
    try {
      cli.ch.assertExchange(
        cli.exchange,
        cli.opts.exchangeType,
        cli.opts.exchange);
      cb();
    } catch (ex) {
      cb(ex);
    }
  };
};

//
// routingKey should be the channel
//
adapter.publish.publish = function(cli) {
  return function(routingKey, chunk) {
    return cli.ch.publish(
      cli.exchange,
      routingKey,
      chunk,
      cli.opts.producerOptions);
  };
};

//
// subscribe interfaces
//
adapter.subscribe.createClient  = adapter.publish.createClient;
adapter.subscribe.destroyClient = adapter.publish.destroyClient;

adapter.subscribe.onReady = function(cli) {
  return function(cb) {
    function sub(err) {
      if (err) {
        cb(err);
      } else if (!cli.routingKey) {
        cli.routingKey = cli.channel;
        cli.ch.bindQueue(
          cli.queue,
          cli.exchange,
          cli.routingKey,
          {},
          sub);
        cb();
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
      cli.emit('message', msg.content.toString());
      cli.ch.ack(msg);
    }

    function assertQueueCb(err, res) {
      if (err) {
        cb(err);
      } else {
        cli.ch.consume(
          res.queue,
          messageCb,
          cli.opts.consumerOptions,
          consumeCb);
        cli.queue = res.queue;
      }
    }

    cli.on('connect', function() {
      try {
        cli.ch.assertExchange(
          cli.exchange,
          cli.opts.exchangeType,
          cli.opts.exchange);
        cli.ch.assertQueue(
          cli.opts.queue,
          cli.opts.queueOptions,
          assertQueueCb);
      } catch (ex) {
        cb(ex);
      }
    });
  };
};

adapter.subscribe.subscribe = function(cli) {
  return function(cb) {
    cli.on('message', cb);
  };
};

module.exports = {
  Publish: require('../../publish')(adapter),
  Subscribe: require('../../subscribe')(adapter)
};
