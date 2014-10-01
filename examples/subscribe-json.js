'use strict';

var adapter = process.env.ADAPTER || 'redis';

var queue = require('../lib')(adapter);

var cats = queue.Subscribe({channel: 'cats'});

cats.on('ready', function() {
  console.log('connected');
});

cats.on('message', function(coolCat){
  console.log('message: ' +
    JSON.stringify(coolCat) + '<' + typeof coolCat + '>');
});

cats.on('error', function(err) {
  console.error('err: ' + err.message);
});
