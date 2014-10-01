# mqee

a standard interface to access message queues. Both the publisher and the subscriber are event emitters.

``` javascript
var mqee = require('mqee');

//
// { [Function]
//   version: '0.0.0',
//   path: '/Users/dscape/Desktop/dev/yldio/tc/mqee/lib',
//   adapters: [ 'redis', 'amqp' ]
// }
//

var queue = mqee('redis');

//
// { Publish:
//   { [Function: Publish]
//     defaults: { port: '6379', host: 'localhost' } },
//  Subscribe:
//   { [Function: Subscribe]
//     defaults: { port: '6379', host: 'localhost' } } }
//

console.log(queue.Publish.defaults);

//
// { port: '6379', host: 'localhost' }
//
```

## Publish

``` js
'use strict';

var queue = require('../lib/mqee')('redis');
var pub = queue.Publish();

pub.on('ready', function() {
  var channel = pub.channel('cats');
  channel.publish({meow: 'yay'}, console.log);
});
```

## Subscribe

```js
'use strict';

var queue = require('../lib/mqee')('redis');

var cats = queue.Subscribe({channel: 'cats'});

cats.on('message', function(coolCat){
  console.log('message: ' + JSON.stringify(coolCat));
});
```

## Channels & Validation

Channels are streams, so you can pipe to them.

You can use your joi schemas to validate and prevent [bad messages](https://github.com/yldio/mqee/blob/master/examples/meow.json-stream.txt#L8) from being sent.

``` js
'use strict';

var Joi = require('joi');

var fs = require('fs');
var queue = require('../lib/mqee')('redis');
var pub = queue.Publish();

pub.on('ready', function() {
  var channel = pub.channel('cats', {
    schema: {
      meow : Joi.string().required()
    }
  });

  channel.on('error', function (err) {
    console.error('err: ' + err);
  });

  fs.createReadStream(__dirname + '/meow.json-stream.txt')
    .pipe(channel);
});

setTimeout(pub.close, 100);
```

I'm sorry, that's all the docs I had time to write so far. Pull requests are welcome
