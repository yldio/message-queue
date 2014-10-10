'use strict';

var types = require('core-util-is');

module.exports = {
  types   : types,
  getType : getType,
  noop    : noop,
  toJSON  : toJSON,
  onClose : onClose,
  errors  : errors
};

function noop() {}

function toJSON(str) {
  try {
    return JSON.parse(str);
  } catch (ex) {
    return null;
  }
}

function onClose(emitter) {
  return function(onEnd) {
    if (emitter.closed) {
      onEnd();
    } else {
      onEnd = onEnd || noop;
      emitter.closed = true;
      emitter.ready = false;
      emitter.emit('close');
      emitter._close(onEnd);
    }
  };
}

function getType(value) {
  var type = Object.keys(types)
  .filter(function(type) {
    return types[type](value);
  });

  return type[0].toLowerCase().slice(2);
}


function errors(err, type, data) {
  var error = new Error(err);
  
  if (type) {
    error.type = type; 
  }

  if (data) {
    error.data = data;
  }

  return error;
}
