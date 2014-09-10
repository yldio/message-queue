'use strict';

var Joi = require('joi');

module.exports = {
  name     : Joi.string().required(),
  defaults : Joi.object().keys({
    port: Joi.number().required(),
    host: Joi.string().hostname().required()
  }).required(),
  //
  // publish
  //
  createClient: Joi.func().required(),
  destroyClient: Joi.func().required(),
  whenReady: Joi.func().required(),
  publish: Joi.func().required()
};
