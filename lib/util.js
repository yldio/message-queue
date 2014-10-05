'use strict';

var types = require('core-util-is');

module.exports = {
  types   : types,
  getType : getType,
  noop    : function() {},
  toJSON  : toJSON,
  onClose : onClose
};

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
      onEnd = onEnd || exports.noop;
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
