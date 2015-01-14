'use strict';

var kafka     = require('kafka-node')
var format    = require('util').format;
var defaults  = require('./defaults');

var Client = kafka.Client;
var HighLevelProducer = kafka.HighLevelProducer;
var HighLevelConsumer = kafka.HighLevelConsumer;

//
// AMQP adapter
//

var adapter = {
  name      : 'kafka',
  defaults  : defaults,
  publish   : {},
  subscribe : {}
};

function client(opts) {
  return new Client(
    format('%s:%s%s',
      opts.host,
      opts.port,
      opts.meta.path && '/' + opts.meta.path),
    opts.meta.clientId,
    opts.meta.zkOptions
  );
}

//
// publish interfaces
//
adapter.publish.createClient = function(opts) {
  var cli = new HighLevelProducer(client(opts));
  cli.on('error', opts.onError);
  return cli;
};

adapter.publish.destroyClient = function(cli) {
  return function(cb) {
    // the client can call close before the conn
    // is ready and emit the `ready`event
    if (cli.ready) {
      cli.close(cb);
    } else {
      cli.closed = true;
      cb();
    }
  };
};

adapter.publish.onReady = function(cli) {
  return function(cb) {
    process.nextTick(function() {
    cli.on('ready', function() {
      if (cli.closed) {
        cli.close(cb);
      } else {
        cb();
      }
    });});
  };
};

adapter.publish.prepareChannels = function(cli) {
  return function(cb) { process.nextTick(cb); };
};

//
// routingKey should be the channel
//
adapter.publish.publish = function(cli) {
  return function(topic, message, cb) {
    cli.send([
      {topic: topic, messages: message}
    ], function(err, data) {
      if (err) {
        cb(err);
      } else {
        cb();
      }
    });
  };
};

//
// subscribe interfaces
//
adapter.subscribe.createClient  = function(opts) {
  var cli = new HighLevelConsumer(
    client(opts),
    [{topic: opts.meta.channel}],
    opts.meta.consumer
  );

  cli.on('error', opts.onError);
  cli.on('offsetOutOfRange', opts.onError);

  return cli;
};

adapter.subscribe.destroyClient = function(cli) {
  return function(cb) {
    process.nextTick(function() {
      cli.close(cb);
    });
  };
};
adapter.subscribe.onReady = function(cli) {
  return function(cb) {
    process.nextTick(cb);
  };
}

adapter.subscribe.subscribe = function(cli) {
  return function(cb) {
    cli.on('message', function(message) {
      cb(message.value);
    });
  };
};

module.exports = {
  Publish: require('../../publish')(adapter),
  Subscribe: require('../../subscribe')(adapter)
};
