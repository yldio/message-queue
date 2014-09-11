'use strict';

module.exports = {
  name: 'mockAdapter',
  defaults: {
    port: 1414,
    host: 'localhost'
  },
  publish: {
    createClient: function(opts) {
      var cli = opts;
      return cli;
    },
    destroyClient: function() {
      return function(f) {
        f();
      };
    },
    prepareChannels: function() {
      return function (cb) { cb(); };
    },
    onReady: function() {
      return function(f) {
        return process.nextTick(f);
      };
    },
    publish: function() {
      return function(name, chunk, enc, f) {
        f();
      };
    }
  },
  subscribe: {
    createClient: function(opts) {
      var cli = opts;
      return cli;
    },
    destroyClient: function() {
      return function(f) {
        f();
      };
    },
    onReady: function() {
      return function(f) {
        return process.nextTick(f);
      };
    },
    subscribe: function() {
      return function(name, chunk, enc, f) {
        f();
      };
    }
  }
};
