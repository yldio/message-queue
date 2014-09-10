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
      throw new Error('channel is required');
    }

    return emitter;
  }

  adp = adp || {};

  var validation = Joi.validate(adp, schema, {abortEarly: true});

  if (validation.error) {
    throw validation.error;
  }

  Subscribe.defaults = adp.defaults = (adp.defaults || {});

  return Subscribe;
};
