'use strict';

var Writable = require('stream').Writable;
var EventEmitter = require('events').EventEmitter;
var VError = require('VError');
var stringify = require('json-stringify-safe');
var Joi = require('joi');

var schema = require('./interface');

module.exports = function(adp) {
  function Publish(opts) {
    opts = opts || {};

    var emitter = new EventEmitter();

    emitter.port = +(opts.port || Publish.defaults.port);
    emitter.host = opts.host || Publish.defaults.host;

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

    cli.validate = function(data, schema, next) {
      if (schema) {
        if (typeof data === 'object') {
          Joi.validate(data, schema, {
            stripUnknown: true,
            abortEarly: true,
            convert: true
          }, function(err, info) {
            if (err) {
              next(err);
            } else {
              next(undefined, stringify(info));
            }
          });
        } else {
          next(
            new VError('Expecting object not %s', typeof data));
        }
      } else {
        next(undefined, typeof data === 'object' ? stringify(data) : data);
      }
    };

    adp.onReady(cli)(function(err) {
      //
      // event emitter handlers might
      // not be registered yet, we
      // need to give them a change to register
      // their handlers
      //
      process.nextTick(function() {
        if (err) {
          emitter.emit('error', err);
          emitter.emit('end');
        } else {
          emitter.closed = false;
          emitter.emit('ready');
        }
      });
    });

    emitter.publish = adp.publish(cli);

    emitter.channel = function createWriteStream(name, opts) {
      opts = opts || {};

      var ws = new Writable();
      var schema = opts.schema;

      ws._write = function(chunk, enc, next) {
        emitter.publish(name, chunk, enc, next);
      };

      ws.publish = function(data, next) {
        if (emitter.closed) {
          return next(new Error('Connection closed'));
        }
        cli.validate(data, schema, function(err, serializedData) {
          if (err) {
            return next(err);
          }
          ws._write(serializedData, 'utf-8', function() {
            next(undefined, {
              ack: true,
              ts: new Date(),
              written: serializedData
            });
          });
        });
      };

      return ws;
    };

    emitter.onError = onError;

    emitter.closed = true;
    emitter._close = adp.destroyClient(cli);

    emitter.close = function(onEnd) {
      emitter.closed = true;
      emitter._close(onEnd);
    };

    return emitter;
  }

  adp = adp || {};
  var validation = Joi.validate(adp, schema, {abortEarly: true});

  if (validation.error) {
    throw validation.error;
  }

  Publish.defaults = adp.defaults;
  Publish.name = adp.name;

  adp = adp.publish;

  return Publish;
};
