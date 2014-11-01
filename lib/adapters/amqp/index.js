'use strict';

var defaults  = require('./defaults');
var format    = require('util').format;
var amqp      = require('./amqp');
var noop      = require('../../util').noop;

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
  var cli = {};

  cli.uri             = amqpURI(opts);
  cli.socketOptions   = opts.meta.socketOptions;
  cli.exchange        = opts.meta.exchange;
  //
  //  AMQP options
  //
  cli.exchangeType    = opts.meta.exchangeType;
  cli.exchangeOptions = opts.meta.exchangeOptions;
  cli.queueOptions    = opts.meta.queueOptions;
  cli.consumerOptions = opts.meta.consumerOptions;
  cli.producerOptions = opts.meta.producerOptions;

  cli.onError         = opts.onError;
  cli.amqp            = amqp(cli.uri, cli.socketOptions, opts.onError);

  return cli;
};

//
// should close first the channel then the conn
//
adapter.publish.destroyClient = function(cli) {
  return function(cb) {
    if (cli.amqpChannel) {
      cli.amqpChannel.close(function() {
        cli.amqp.destroyClient(cb);
      });
    } else {
      cli.amqp.destroyClient(cb);
    }
  };
};

adapter.publish.onReady = function(cli) {
  return function(cb) {
    createChannel(cli)(function(err) {
      if (err) {
        cb(err);
      } else {
        cb();
      }
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
    
    cli.amqpChannel.assertExchange(cli.exchange,
      cli.exchangeType,
      cli.exchangeOptions,
      assertExchangeCb);
  };
};

//
// routingKey should be the channel
//
adapter.publish.publish = function(cli) {
  return function(routingKey, chunk, next) {
    next = next || noop;
    function publishCb() {
      cli.amqpChannel.publish(
        cli.exchange,
        routingKey,
        chunk,
        cli.producerOptions);

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
    function assertQueueCb(err, res) {
      if (err) {
        cb(err);
      } else {
        cli.queueId = res.queue;
        cb();
      }
    }

    createChannel(cli)(function(err) {
      if (err) {
        cb(err);
      } else {
        cli.amqpChannel.assertExchange(cli.exchange,
          cli.exchangeType,
          cli.exchangeOptions);
        cli.amqpChannel.assertQueue('',
          cli.queueOptions,
          assertQueueCb);
      }
    });
  };
};

adapter.subscribe.subscribe = function(cli) {
  return function(cb) {
    function sub(err) {
      if (err) {
        cb(err);
      } else {
        cli.amqpChannel.bindQueue(cli.queueId, 
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
      cli.amqpChannel.ack(msg);
    }

    cli.amqpChannel.consume(cli.queueId,
      messageCb,
      cli.consumerOptions,
      consumeCb);
  };
};

module.exports = {
  Publish: require('../../publish')(adapter),
  Subscribe: require('../../subscribe')(adapter)
};
