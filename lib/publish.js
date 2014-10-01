'use strict';

var EventEmitter    = require('events').EventEmitter;
var VError          = require('VError');
var stringify       = require('json-stringify-safe');
var Joi             = require('joi');
var extend          = require('xtend');
var validateAdapter = require('./validate_adapter');
var through         = require('through');
var JSONStream      = require('JSONStream');
var es              = require('event-stream');
var ut              = require('./util');

module.exports = function(adp) {
  function Publish(opts) {
    opts = opts || {};

    var emitter = new EventEmitter();

    emitter.port = +(opts.port || Publish.defaults.port);
    emitter.host = opts.host || Publish.defaults.host;

    emitter.meta = extend({}, Publish.defaults, opts);

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
        if (ut.types.isObject(data)) {
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
          var t = ut.getType(data);
          next(new VError('Expecting object not %s', t));
        }
      } else {
        next(undefined, ut.types.isObject(data) ? stringify(data) : data);
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
          adp.prepareChannels(cli)(function(err) {
            if (err) {
              emitter.emit('error', err);
              emitter.emit('end');
            } else {
              emitter.closed = false;
              emitter.emit('ready');
            }
          });
        }
      });
    });

    emitter.publish = adp.publish(cli);

    emitter.channel = function createWriteStream(name, opts) {
      opts = opts || {};

      var ws = through();
      var schema = opts.schema;

      ws.json = ut.types.isBoolean(opts.json) ? opts.json :
        ut.types.isObject(schema);

      ws.on('pipe', function(src) {
        var dest = ws.json ? JSONStream.parse() : es.split();
        dest.on('error', function(err) { ws.emit('error', err); });
        src
        .pipe(dest)
        .on('data', function(obj) {
          ws.publish(obj, function(err, res) {
            if (err) {
              return ws.emit('error', err);
            }
            return res;
          });
        });
      });

      ws.publish = function(data, next) {
        if (emitter.closed) {
          return next(new Error('Connection closed'));
        }

        cli.validate(data, schema, function(err, serializedData) {
          if (err) {
            return next(err);
          }

          var buff = new Buffer(serializedData);

          emitter.publish(name, buff, function() {
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
      onEnd = onEnd || ut.noop;
      emitter.closed = true;
      emitter._close(onEnd);
    };

    return emitter;
  }

  adp = adp || {};

  validateAdapter(adp);

  Publish.defaults = adp.defaults;
  Publish.name = adp.name;

  adp = adp.publish;

  return Publish;
};
