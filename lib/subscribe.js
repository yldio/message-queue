'use strict';

var EventEmitter    = require('events').EventEmitter;
var extend          = require('xtend');
var validateAdapter = require('./validate_adapter');
var ut              = require('./util');

module.exports = function(adp) {
  function Subscribe(opts) {
    opts = opts || {};

    if (!opts.channel) {
      throw new Error('channel is required');
    }

    var emitter = new EventEmitter();

    emitter.channel = opts.channel;

    emitter.ready = false;
    emitter.port  = +(opts.port || Subscribe.defaults.port);
    emitter.host  = opts.host || Subscribe.defaults.host;

    emitter.meta = extend({}, Subscribe.defaults, opts);
    emitter.json = ut.types.isBoolean(opts.json) ?
      opts.json :
      true;

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
          onError(err);
          emitter.emit('end');
        } else {
          emitter.ready = true;
          emitter.emit('ready');
        }
      });
    });

    adp.subscribe(cli)(function(message) {
      process.nextTick(function() {
        if (emitter.json) {
          var msg = ut.toJSON(message);
          if (msg) {
            emitter.emit('message', msg);
          } else {
            onError(new Error('Not valid json: ' + message));
          }
        } else {
          emitter.emit('message', message);
        }
      });
    });

    emitter.closed  = false;
    emitter._close  = adp.destroyClient(cli);
    emitter.close   = ut.onClose(emitter);

    return emitter;
  }

  adp = adp || {};

  validateAdapter(adp);

  Subscribe.defaults = adp.defaults;
  Subscribe.adapterName = adp.name;

  adp = adp.subscribe;

  return Subscribe;
};
