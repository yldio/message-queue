'use strict';

var VError = require('verror');

var mq = module.exports = function(adapter) {
  if (!~mq.adapters.indexOf(adapter)) {
    throw new VError('Adapter %s is not supported', adapter);
  }
  return require('./adapters/' + adapter);
};

mq.Joi      = require('joi');
mq.version  = require('../package.json').version;
mq.path     = __dirname;
mq.adapters = ['redis', 'amqp'];
