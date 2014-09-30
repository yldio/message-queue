'use strict';

var types = require('core-util-is');

exports.types = types;

exports.toJSON = function toJSON(str) {
  try {
    return JSON.parse(str);
  } catch (ex) {
    return null;
  }
};

exports.getType = function getType(value) {
  var type = Object.keys(types)
  .filter(function(type) {
    return types[type](value);
  });

  return type[0].toLowerCase().slice(2);
};
