# mqee

a standard interface to access message queues. Both the publisher and the subscriber are event emitters.

## Table of Contents

- [License](https://github.com/yldio/mqee/blob/master/LICENSE.md)
- [Contributing](https://github.com/yldio/mqee/blob/master/CONTRIBUTING.md#contributing)
- [Usage](#usage)
  - [Publish](#publish)
  - [Subscribe](#subscribe)
  - [Channels & Validation](#channels--validation)
- [API](#api)

## Examples

### Publish

``` js
var queue = require('mqee')('redis');
var pub = queue.Publish();

//
// {
//   port: 6379,
//   host: 'localhost',
//   publishQueue: [],
//   meta:
//    { port: '6379',
//      host: 'localhost',
//      socket_nodelay: true,
//      socket_keepalive: true },
//   ready: false,
//   closed: false,
//   channel: [Function: createWriteStream] }
//

var channel = pub.channel('cats');

//
// { writable: true,
//   readable: true,
//   json: false }
//

channel.publish({meow: 'yay'}, console.log);
```

### Subscribe

```js
var queue = require('mqee')('redis');

var cats = queue.Subscribe({channel: 'cats'});

//
// { channel: 'cats',
//   port: 6379,
//   host: 'localhost',
//   meta:
//    { port: '6379',
//      host: 'localhost',
//      channel: 'cats' },
//   ready: false,
//   closed: false,
//   json: true }
//

cats.on('message', function(coolCat){
  console.log('message: ' + JSON.stringify(coolCat));
});
```

### Channels & Validation

Channels are streams so you can pipe to them.

You can use your [joi](https://github.com/hapijs/joi) schemas to validate and prevent [bad messages](https://github.com/yldio/mqee/blob/master/examples/meow.json-stream.txt#L8) from being sent.

``` js
var Joi = require('joi');

var fs = require('fs');
var queue = require('mqee')('redis');
var pub = queue.Publish();

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
```

## API

### Publish

``` js
var queue = require('mqee')('redis');
var pub = queue.Publish();
```

#### Connection Events

`pub` will emit some events about the state of the connection to the server.

##### Ready

`pub` will emit `ready` when it has connected to the server, and it is not ready to be written to. You can still `publish` before server being ready since internally `mqee` will buffer those messages and publish once a connection is established.

##### Error

`pub` will emit error when encountering an error connecting to the server.


##### Close

`close` is emitted when the developer calls the `pub.close()` function.

##### End

`pub` emits `end` when for some reason the connection was terminated.

### Channel

### Subscribe

I'm sorry, that's all the docs I had time to write so far. Pull requests are welcome

