'use strict';

var Joi = require('joi');

exports.schema = {
  when       : Joi.date().required(),
  name       : Joi.string().required(),
  likes      : Joi.object()
};
