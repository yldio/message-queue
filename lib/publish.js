'use strict';

var EventEmitter    = require('events').EventEmitter;
var VError          = require('verror');
var stringify       = require('json-stringify-safe');
var Joi             = require('joi');
var extend          = require('xtend');
var validateAdapter = require('./validate_adapter');
var through         = require('through');
var JSONStream      = require('JSONStream');
var es              = require('event-stream');
var async           = require('async');
var ut              = require('./util');

module.exports = function(adp) {
  function Publish(opts) {
    opts = opts || {};

    var emitter = new EventEmitter();

    emitter.ready = false;
    emitter.port = +(opts.port || Publish.defaults.port);
    emitter.host = opts.host || Publish.defaults.host;
    emitter.publishQueue = [];

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

    emitter.publish = adp.publish(cli);

    adp.onReady(cli)(function(err) {
      //
      // event emitter handlers might
      // not be registered yet, we
      // need to give them a change to register
      // their handlers
      //
      process.nextTick(function() {
        if (err) {
          onError(err);
          emitter.emit('end');
        } else {
          adp.prepareChannels(cli)(function(err) {
            if (err) {
              onError(err);
              emitter.emit('end');
            } else {
              emitter.ready = true;
              emitter.emit('ready');
              //
              // send any buffered messages
              //
              async.eachLimit(emitter.publishQueue, 5, function(pub, cb) {
                emitter.publish(pub.name, pub.buff, function() {
                  pub.next(undefined, pub.resp);
                  cb();
                });
              }, function() {
                //
                // reset so users know
                // its been sent
                //
                emitter.publishQueue = [];
              });
            }
          });
        }
      });
    });

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
          var resp = {
            ack: true,
            ts: new Date(),
            written: serializedData
          };

          if (!emitter.ready) {
            emitter.publishQueue.push({
              resp: resp,
              name: name,
              buff: buff,
              next: next
            });
          } else {
            emitter.publish(name, buff, function() {
              next(undefined, resp);
            });
          }

        });
      };

      return ws;
    };

    emitter.onError = onError;

    emitter.closed = false;
    emitter._close = adp.destroyClient(cli);
    emitter.close = ut.onClose(emitter);

    return emitter;
  }

  adp = adp || {};

  validateAdapter(adp);

  Publish.defaults = adp.defaults;
  Publish.adapterName = adp.name;

  adp = adp.publish;

  return Publish;
};
