'use strict';

var EventEmitter = require('events').EventEmitter;
var Joi = require('joi');

var schema = require('./interface');

module.exports = function(adp) {
  function Subscribe(opts) {
    opts = opts || {};

    var emitter = new EventEmitter();

    emitter.channel = opts.channel;

    if (!emitter.channel) {
      var err = new Error('channel is required');
      process.nextTick(function () {
        emitter.close(function () {
          emitter.emit('end');
        });
      });
      throw new Error('channel is required');
    }

    emitter.port = +(opts.port || Subscribe.defaults.port);
    emitter.host = opts.host || Subscribe.defaults.host;

    emitter.meta = opts;

    function onError(err) {
      process.nextTick(function() { emitter.emit('error', err); });
    }

    var cli = emitter.cli = adp.createClient({
      port: emitter.port,
      host: emitter.host,
      meta: emitter.meta,
      onError: onError
    });

    cli.channel = emitter.channel;

    adp.onReady(cli)(function(err) {
      process.nextTick(function() {
        if (err) {
          emitter.emit('error', err);
          emitter.emit('end');
        } else {
          emitter.emit('ready');
        }
      });
    });

    adp.subscribe(cli)(function(err, message) {
      process.nextTick(function() {
        if (err) {
          emitter.emit('error', err);
          emitter.emit('end');
        } else {
          emitter.emit('message', message);
        }
      });
    });

    emitter.close = adp.destroyClient(cli);

    return emitter;
  }

  adp = adp || {};

  var validation = Joi.validate(adp, schema, {abortEarly: true});

  if (validation.error) {
    throw validation.error;
  }

  Subscribe.defaults = adp.defaults;
  Subscribe.name = adp.name;

  adp = adp.subscribe;

  return Subscribe;
};
