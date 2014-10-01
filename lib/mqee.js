'use strict';

var VError = require('verror');

var mqee = module.exports = exports = function(adapter) {
  if (!~mqee.adapters.indexOf(adapter)) {
    throw new VError('Adapter %s is not supported', adapter);
  }
  return require('./adapters/' + adapter);
};

mqee.Joi = require('joi');
mqee.version = require('../package.json').version;
mqee.path = __dirname;
mqee.adapters = ['redis', 'amqp'];
