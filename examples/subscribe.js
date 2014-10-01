'use strict';

var queue = require('../lib/mqee')('redis');

var cats = queue.Subscribe({channel: 'cats'});

cats.on('message', function(coolCat){
  console.log(coolCat);
});

cats.on('error', function(err) {
  console.error('err: ' + err.message);
});
