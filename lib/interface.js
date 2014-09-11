'use strict';

var Joi = require('joi');

module.exports = {
  name            : Joi.string().required(),
  defaults        : Joi.object().keys({
    port          : Joi.number().required(),
    host          : Joi.string().hostname().required()
  }).required(),
  //
  // publish
  //
  publish         : Joi.object().keys({
    createClient  : Joi.func().required(),
    destroyClient : Joi.func().required(),
    onReady       : Joi.func().required(),
    publish       : Joi.func().required()
  }).required(),
  //
  // subscribe
  //
  subscribe       : Joi.object().keys({
    createClient  : Joi.func().required(),
    destroyClient : Joi.func().required(),
    onReady       : Joi.func().required(),
    subscribe     : Joi.func().required()
  }).required()
};
