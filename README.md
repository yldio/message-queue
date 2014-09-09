[![build status](http://img.shields.io/travis/yldio/easymq.svg?style=flat)](https://travis-ci.org/yldio/mqee)![npm downloads](http://img.shields.io/npm/dm/mqee.svg?style=flat)![npm version](http://img.shields.io/npm/v/mqee.svg?style=flat)

# mqee

a standard interface to access message queues

``` javascript
var mqee = require('mqee')('amqp');

var sub = new mqee.Subscribe({
  //
  // adapter specific options
  //
});

var follow = sub.channel('cats');

follow.on('data', function(){});
follow.on('error', function(){});
follow.on('end', function(){});

var pub = new mqee.Publish({
  //
  // adapter specific options
  //
});

pub.on('ready', function(){});
pub.on('error', function(){});
pub.on('end', function(){});

var channel = pub.channel('some channel');

channel.write('{"message": "ok"}', function (ack) {
  //
  // your callback code here
  //
});

pub.close();
follow.close();
```

