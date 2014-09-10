'use strict';

var fs = require('fs');
var path = require('path');

var helpers = exports;

helpers.timeout = 200;
helpers.adapters = process.env.ADAPTER ?
  [process.env.ADAPTER] :
  fs.readdirSync(path.join(__dirname, '..', '..', 'lib', 'adapters'));

helpers.readFixture = function(filepath) {
  var ext = path.extname(filepath);

  function readFile(filepath) {
    return fs.readFileSync(filepath, 'utf-8');
  }

  var read = (ext === '.js' || ext === '.json') ? require : readFile;

  return read(path.join(__dirname, '..', 'fixtures', filepath), 'utf-8');
};
