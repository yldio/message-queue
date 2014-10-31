'use strict';

var EventEmitter    = require('events').EventEmitter;
var extend          = require('xtend');
var validateAdapter = require('./validate_adapter');
var ut              = require('./util');
var async           = require('async');

module.exports = function(adp) {
  function Subscribe(opts) {
    opts = opts || {};

    var emitter = new EventEmitter();

    emitter.channel = opts.channel;

    emitter.ready = false;
    emitter.port  = +(opts.port || Subscribe.defaults.port);
    emitter.host  = opts.host || Subscribe.defaults.host;

    emitter.meta = extend({}, Subscribe.defaults, opts);

    emitter.json = ut.types.isBoolean(opts.json) ? opts.json : true;

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

    async.series([
      function(cb) {
        adp.onReady(cli)(function(err) {
          process.nextTick(function() {
            if (err) {
              cb(err);
            } else {
              emitter.ready = true;
              emitter.emit('ready');
            }
            cb();
          });
        });
      },
      function(cb) {
        adp.subscribe(cli)(function(err, message) {
          process.nextTick(function() {
            if (err) {
              cb(err);
            } else {
              if (emitter.json) {
                var msg = ut.toJSON(message);
                if (msg) {
                  emitter.emit('message', msg);
                } else {
                  onError(new Error('Not valid json ' + message));
                }
              } else {
                emitter.emit('message', message);
              }
            }
            cb();
          });
        });
      }
    ], function(err) {
      if (err) {
        emitter.emit('error', err);
        emitter.emit('end');
      }
    });

    emitter.closed  = false;
    emitter._close  = adp.destroyClient(cli);
    emitter.close   = ut.onClose(emitter);

    if (!emitter.channel) {
      process.nextTick(function() {
        emitter.close(function() {
          emitter.emit('end');
        });
      });
      throw new Error('channel is required');
    }

    return emitter;
  }

  adp = adp || {};

  validateAdapter(adp);

  Subscribe.defaults = adp.defaults;
  Subscribe.adapterName = adp.name;

  adp = adp.subscribe;

  return Subscribe;
};
