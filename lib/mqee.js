'use strict';

module.exports = function(adapter) {
  return require('./adapters/' + adapter);
};
