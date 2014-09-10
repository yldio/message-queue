'use strict';

var fs = require('fs');
var path = require('path');
var debug = require('debug')('test/helpers');

var helpers = exports;

helpers.timeout = 200;
helpers.adapters = fs.readdirSync(
  path.join(__dirname, '..', '..', 'lib', 'adapters'));

if(process.env.ADAPTERS) {
  var adapters = process.env.ADAPTERS.trim().split(',');
  debug('adapters: ' + adapters.join(', '));
  debug('defaults: ' + helpers.adapters.join(', '));
  helpers.adapters = adapters;
}

helpers.readFixture = function(filepath) {
  var ext = path.extname(filepath);

  function readFile(filepath) {
    return fs.readFileSync(filepath, 'utf-8');
  }

  var read = (ext === '.js' || ext === '.json') ? require : readFile;

  return read(path.join(__dirname, '..', 'fixtures', filepath), 'utf-8');
};
