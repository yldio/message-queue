'use strict';

var fs = require('fs');
var path = require('path');
var test = require('tape');
var debug = require('debug')('test/helpers');

var helpers = exports;

helpers.timeout = 200;
helpers.adapters = fs.readdirSync(
  path.join(__dirname, '..', '..', 'lib', 'adapters'));

if (process.env.ADAPTERS) {
  var adapters = process.env.ADAPTERS.trim().split(',');
  debug('adapters: ' + adapters.join(', '));
  debug('defaults: ' + helpers.adapters.join(', '));
  helpers.adapters = adapters;
}

helpers.testFor = function(adapterName, path) {
  path.unshift('test');
  return function(desc, cb) {
    test(path.join('/') + '<' + adapterName + '> ' + desc, cb);
  };
};

helpers.fixturePath = function(filename) {
  return path.join(__dirname, '..', 'fixtures', filename);
};

helpers.readFixture = function(filepath) {
  var ext = path.extname(filepath);

  function readFile(filepath) {
    return fs.readFileSync(filepath, 'utf-8');
  }

  var read = (ext === '.js' || ext === '.json') ? require : readFile;

  return read(helpers.fixturePath(filepath), 'utf-8');
};
