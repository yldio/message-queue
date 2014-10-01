'use strict';

var adapter = process.env.ADAPTER || 'redis';

var queue = require('../lib/mqee')(adapter);
var pub = queue.Publish();
var channel = pub.channel('cats');

channel.publish('meow', console.log);

setTimeout(pub.close, 200);
