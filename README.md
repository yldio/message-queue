[![build status](http://img.shields.io/travis/yldio/easymq.svg?style=flat)](https://travis-ci.org/yldio/mqee)![npm downloads](http://img.shields.io/npm/dm/mqee.svg?style=flat)![npm version](http://img.shields.io/npm/v/mqee.svg?style=flat)

# mqee

a standard interface to access message queues

``` javascript
var mqee = require('mqee')('amqp');

var producter = new mqee.Producer({
  queueNamePrefix: 'YLD'
  //
  // adapter specific options
  //
});
```

