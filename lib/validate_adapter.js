'use strict';

var Joi = require('joi');
var schema = require('./interface');

module.exports = function (adp) {
  var validation = Joi.validate(adp, schema, {
    abortEarly: true,
    allowUnknown: true
  });

  if (validation.error) {
    throw validation.error;
  }
};
