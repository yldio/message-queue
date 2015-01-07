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
    emitter.port  = +(opts.port || Publish.defaults.port);
    emitter.host  = opts.host || Publish.defaults.host;
    emitter.queue = [];

    emitter.meta = extend({}, Publish.defaults, opts);

    function onError(err) {
      process.nextTick(function() { emitter.emit('error', err); });
    }

    var cli = emitter.cli = adp.createClient({
      port    : emitter.port,
      host    : emitter.host,
      meta    : emitter.meta,
      onError : onError
    });

    cli.validate = function(data, schema, next) {
      if (Buffer.isBuffer(data)) {
        data = data.toString();
      }

      if (schema) {
        if (ut.types.isObject(data)) {
          Joi.validate(data, schema, {
            stripUnknown: true,
            abortEarly  : true,
            convert     : true
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
        next(undefined,
          ut.types.isObject(data) ?
            stringify(data) :
            data);
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
              async.eachLimit(emitter.queue, 5, function(pub, cb) {
                emitter.publish(pub.name, pub.buff, function() {
                  pub.next(undefined, pub.resp);
                  cb();
                });
              }, function() {
                //
                // reset so users know
                // its been sent
                //
                emitter.queue = [];
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

      ws.json = ut.types.isBoolean(opts.json) ?
        opts.json :
        ut.types.isObject(schema);

      ws.on('pipe', function(src) {
        var dest = ws.json ?
          JSONStream.parse() :
          es.split();

        src.pipe(dest)
        .on('data', ws.publish)
        .on('error', function(err) {
          // FIX THIS - is emitting to mutch :)
          ws.emit('error', err);
          this.end();
        })
        .on('end', function() {
          ws.emit('end');
        });
      });

      function executePublish(err, cb) {
        if (cb) {
          cb(err);
        } else {
          ws.emit('error', err);
        }
      }

      ws.publish = function(data, next) {
        if (emitter.closed) {
          return executePublish(ut.mqError('Connection closed',
            'adapter',
            data), next);
        }

        cli.validate(data, schema, function(err, serializedData) {
          if (err) {
            return executePublish(ut.mqError(err,
              'validation',
              data), next);
          } else {
            var resp = {
              ack     : true,
              ts      : new Date(),
              written : serializedData
            };

            var buff = new Buffer(serializedData);

            if (!emitter.ready) {
              emitter.queue.push({
                resp: resp,
                name: name,
                buff: buff,
                next: next || ut.noop
              });
            } else {
              emitter.publish(name, buff);
              if (next) {
                next(undefined, resp);
              }
            }
          }
        });
      };

      return ws;
    };

    emitter.onError = onError;

    emitter.closed  = false;
    emitter._close  = adp.destroyClient(cli);
    emitter.close   = ut.onClose(emitter);

    return emitter;
  }

  adp = adp || {};

  validateAdapter(adp);

  Publish.defaults = adp.defaults;
  Publish.adapterName = adp.name;

  adp = adp.publish;

  return Publish;
};
