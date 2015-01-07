'use strict';

var defaults  = require('./defaults');
var format    = require('util').format;
var amqp      = require('./amqp');

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

function createChannel(cli) {
  return function(cb) {
    function channelCb(err, ch) {
      if (err) {
        cb(err);
      } else {
        ch.on('error', cli.onError);
        ch.on('close', cli.amqp.release);
        cli.amqpChannel = ch;
        cb();
      }
    }

    cli.amqp.createChannel(channelCb);
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
  var cli = amqp(amqpURI(opts), opts.meta.socketOptions);

  //
  //  AMQP options
  //
  cli.opts              = {};
  cli.exchange          = opts.meta.exchange;
  cli.opts.exchangeType = opts.meta.exchangeType;
  cli.opts.exchange     = opts.meta.exchangeOptions;
  cli.opts.queue        = opts.meta.queueOptions;
  cli.opts.consumer     = opts.meta.consumerOptions;
  cli.opts.producer     = opts.meta.producerOptions;

  cli.on('error', opts.onError);

  return cli;
};

//
// should close first the channel then the connection
//
adapter.publish.destroyClient = function(cli) {
  return function(cb) {
    if (cli.ch) {
      cli.ch.close(cb);
    } else {
      // no channel
      cli.emit('ch_was_closed');
      cb();
    }
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
    function assertExchangeCb(err) {
      if (err) {
        cb(err);
      } else {
        cb();
      }
    }

    cli.ch.assertExchange(cli.exchange,
      cli.opts.exchangeType,
      cli.opts.exchange,
      assertExchangeCb);
  };
};

//
// routingKey should be the channel
//
adapter.publish.publish = function(cli) {
  return function(routingKey, chunk) {
    function publishCb() {
      return cli.ch.publish(
        cli.exchange,
        routingKey,
        chunk,
        cli.producerOptions);
    }
    return publishCb();
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
          cli.queueId,
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
      cli.emitter.emit('message', msg.content.toString());
      cli.ch.ack(msg);
    }

    function assertQueueCb(err, res) {
      if (err) {
        cb(err);
      } else {
        cli.ch.consume(
          res.queue,
          messageCb,
          cli.opts.consumer,
          consumeCb);
        cli.queueId = res.queue;
      }
    }

    createChannel(cli)(function(err) {
      if (err) {
        cb(err);
      } else {
        cli.amqpChannel.assertExchange(
          cli.exchange,
          cli.opts.exchangeType,
          cli.opts.exchange);
        cli.amqpChannel.assertQueue(
          '',
          cli.opts.queue,
          assertQueueCb);
      }
    });
  };
};

adapter.subscribe.subscribe = function(cli) {
  return function(cb) {
    cli.emitter.on('message', cb);
  };
};

module.exports = {
  Publish: require('../../publish')(adapter),
  Subscribe: require('../../subscribe')(adapter)
};
