# message-queue

a standard interface to access different message queues. Both the publisher and the subscriber are event emitters. Currently supports `redis` and `amqp`, e.g. RabbitMQ.

## Table of Contents

- [Usage](#usage)
  - [Publish](#publish)
  - [Subscribe](#subscribe)
  - [Channels & Validation](#channels--validation)
- [API](#api)
  - [Publish](#publish-api)
    - [Events](#publish-events)
    - [channel()](#pubchannelname-options)
    - [close()](#pubclosecb)
  - [Channel](#channel-api)
    - [Events](#channel-events)
    - [publish()](#channelpublishmessage-cb)
  - [Subscribe](#subscribe-api)
    - [Events](#subscribe-events)
    - [close()](#subclosecb)
- [Disclaimer](#disclaimer)
- [License](https://github.com/yldio/message-queue/blob/master/LICENSE.md)
- [Contributing](https://github.com/yldio/message-queue/blob/master/CONTRIBUTING.md#contributing)
- [Examples](https://github.com/yldio/message-queue/tree/master/examples)

## Usage

### Publish

``` js
var queue = require('message-queue')('redis');
var pub = queue.Publish();

var channel = pub.channel('cats');

channel.publish({meow: 'yay'}, console.log);
```

### Subscribe

```js
var queue = require('message-queue')('redis');

var cats = queue.Subscribe({channel: 'cats'});

cats.on('message', function(coolCat){
  console.log('message: ' + JSON.stringify(coolCat));
});
```

### Channels & Validation

Channels are streams so you can pipe to them.

In json mode `message-queue` expects newline delimited json. For plaintext, each line gets published.

You can use your [joi](https://github.com/hapijs/joi) schemas to validate and prevent [bad messages](https://github.com/yldio/message-queue/blob/master/examples/meow.json-stream.txt#L8) from being sent.

``` js
var mq = require('message-queue');
var fs = require('fs');
var queue = mq('redis');
var Joi = mq.Joi;
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
var mq = require('message-queue');
var queue = mq('redis');
var pub = queue.Publish(options);
```

`redis` is one of the supported back end adapters. You can find the full list on `mq.adapters`.

`pub` is an `EventEmitter`.

The following options can be used:

- `host`: The host for the server.
- `port`: Define the port.

Default values are specified in `adapters/*/defaults.json`.

Adapter specific options can be passed.

#### Publish Events

`pub` will emit events.

##### Ready

`pub` will emit `ready` when it has connected to the server, and it is not ready to be written to. You can still `publish` before server being ready since internally `message-queue` will buffer those messages and publish once a connection is established.

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
var Joi = mq.Joi;
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

```
var cats = queue.Subscribe({channel: 'cats'});

cats.on('message', console.log);
```

`sub` is an `EventEmitter`.

The following options can be used:

- `channel`: **required** The channel to subscribe to.
- `json`: Expect all messages to be json. Defaults to true.
- `host`: The host for the server.
- `port`: Define the port.

Default values are specified in `adapters/*/defaults.json`.

Adapter specific options can be passed.

#### Subscribe Events

`sub` will emit events.

##### Message

`sub` will emit `message` when a new message arrives

##### Ready

`sub` will emit `ready` when it has connected to the server.

##### Error

`sub` will emit error when encountering an error connecting to the server.

##### Close

`close` is emitted when the developer calls the `sub.close()` function.

##### End

`sub` emits `end` when for some reason the connection was terminated.

#### sub.close(cb)

Closes the connection to the server.

## Disclaimer

Redis does not support features such as ordering or persisting  messages. You can use config files to turn these features on and off on other providers such as `amqp` but each adapter has its own config format.

Pull requests are welcome!
