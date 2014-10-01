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
  - [Publish](#publish-api)
    - [Connection Events](#publish-connection-events)
    - [channel()](#pubchannelname-options)
    - [close()](#pubclosecb)
  - [Channel](#channel-api)
    - [publish()](#ddd)
  - [Subscribe](#subscribe-api)
    - [Connection Events](#subscribe-connection-events)
    - [close()](#subclosecb)

## Usage

### Publish

``` js
var queue = require('mqee')('redis');
var pub = queue.Publish();

var channel = pub.channel('cats');

channel.publish({meow: 'yay'}, console.log);
```

### Subscribe

```js
var queue = require('mqee')('redis');

var cats = queue.Subscribe({channel: 'cats'});

cats.on('message', function(coolCat){
  console.log('message: ' + JSON.stringify(coolCat));
});
```

### Channels & Validation

Channels are streams so you can pipe to them.

You can use your [joi](https://github.com/hapijs/joi) schemas to validate and prevent [bad messages](https://github.com/yldio/mqee/blob/master/examples/meow.json-stream.txt#L8) from being sent.

``` js
var mqee = require('mqee');
var fs = require('fs');
var queue = mqee('redis');
var Joi = mqee.Joi;
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

### Publish API

Create a connection to the server.

``` js
var mqee = require('mqee');
var queue = mqee('redis');
var pub = queue.Publish(options);
```

`pub` is an `EventEmitter`.

The following options can be used:

- `host`: The host for the server.
- `port`: Define the port.

Default values are specified in `adapters/*/defaults.json`.

Adapter specific options can be passed.

#### Publish Connection Events

`pub` will emit some events about the state of the connection to the server.

##### Ready

`pub` will emit `ready` when it has connected to the server, and it is not ready to be written to. You can still `publish` before server being ready since internally `mqee` will buffer those messages and publish once a connection is established.

##### Error

`pub` will emit error when encountering an error connecting to the server.


##### Close

`close` is emitted when the developer calls the `pub.close()` function.

##### End

`pub` emits `end` when for some reason the connection was terminated.

#### pub.channel(name, options)

Returns a channel named `name` for this publisher. See [Channel](#channel-api) for more details.

#### pub.close(cb)

Closes the connection to the server.

### Channel API

``` js
var Joi = mqee.Joi;
var channel = pub.channel('cats', {
  schema: {
    meow : Joi.string().required()
  }
});
```

The following options can be used:

- `schema`: The joi schema that should be used to validate messages before they are published.
- `json`: Ensure only json can be published in this channel. Defaults to true.

`channel` is a `Duplex Stream`. It is created with the `channel` method of the `Publish` object.

``` js
fs.createReadStream(__dirname + '/meow.json-stream.txt')
  .pipe(channel)
  .pipe(process.stdout);
```

When piping you should listen for errors:

``` js
channel.on('error', function(err) {
  console.error('err: ' + err);
});
```

#### Channel Events

##### Error

`channel` will emit error events when validation fails, or there's a parsing problem. This only happens when you use `pipe`, since normal publishes use the error first in callback node.js idiom.

#### channel.publish(message, cb)

Publishes a message. If there is a schema, the message will be validated.

``` js
channel.publish('meow', function (err, ack) {
  if (err) {
    console.error('err: ' + err.message);
  } else {
    console.log(JSON.stringify(ack, null, 2));
  }
});
```

Errors are not emitted unless you are piping.

### Subscribe API

Docs missing here
close
json: false

#### sub.subscribe(channel, options)

#### sub.close(cb)
