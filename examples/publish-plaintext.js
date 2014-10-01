'use strict';

var adapter = process.env.ADAPTER || 'redis';

var queue = require('../lib/mqee')(adapter);
var pub = queue.Publish();
var channel = pub.channel('cats');

channel.publish('meow', function (err, ack) {
  if (err) {
    console.error('err: ' + err.message);
  } else {
    console.log(JSON.stringify(ack, null, 2));
  }
});

setTimeout(pub.close, 200);
