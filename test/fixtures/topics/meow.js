'use strict';

var Joi = require('joi');

exports.schema = {
  meow : Joi.string().required()
};
