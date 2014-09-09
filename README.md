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

var catsSub = sub.channel('cats');

catsSub.on('data', function(){});
catsSub.on('error', function(){});
catsSub.on('end', function(){});

var pub = new mqee.Publish({
  //
  // adapter specific options
  //
});

pub.on('ready', function(){});
pub.on('error', function(){});
pub.on('end', function(){});

//
// topic is a joi schema used to validate messages
//
var catsPub = pub.channel('cats', topic);

catsPub.write('{"message": "ok"}', function (err) {
  //
  // includes `ack` and other errors like validation
  //

  //
  // your callback code here
  //
});

pub.close();
catsSub.close();
```

