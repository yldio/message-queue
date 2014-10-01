'use strict';

var adapter = process.env.ADAPTER || 'redis';

var queue = require('../lib/mqee')(adapter);
var pub = queue.Publish();

pub.on('ready', function() {
  var channel = pub.channel('cats');
  channel.publish({meow: 'yay'}, console.log);
});

setTimeout(pub.close, 100);
