'use strict';

var Joi = require('joi');

module.exports = {
  when  : Joi.date().required(),
  name  : Joi.string().required(),
  likes : Joi.array()
};
