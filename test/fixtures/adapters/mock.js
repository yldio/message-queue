'use strict';

module.exports = {
  name: 'mockAdapter',
  defaults: {
    port: 1414,
    host: 'localhost'
  },
  createClient: function(opts) {
    var cli = opts;
    return cli;
  },
  destroyClient: function() {
    return function(f) {
      f();
    };
  },
  whenReady: function() {
    return function (f) {
      return process.nextTick(f);
    };
  },
  publish: function() {
    return function(name, chunk, enc, f) {
      f();
    };
  }
};
