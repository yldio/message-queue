'use strict';

var adapter = process.env.ADAPTER || 'redis';

var queue = require('../lib/mqee')(adapter);

var cats = queue.Subscribe({
  channel: 'cats',
  json: false
});

cats.on('message', function(coolCat){
  console.log('message: ' + coolCat + '<' + typeof coolCat + '>');
});

cats.on('error', function(err) {
  console.error('err: ' + err.message);
});
