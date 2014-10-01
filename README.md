# mqee

a standard interface to access message queues

``` javascript
var Joi = require('joi');
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

console.log(rabbit.Publish.defaults);

//
// { port: '6379', host: 'localhost' }
//

var cats = new queue.Subscribe({
  //
  // subscribe to the `cats` channel
  //
  channel: 'cats',
  //
  // expect all messages to be json
  // defaults to true, set to false for plaintext
  //
  json: true
  //
  // adapter specific options
  //
});

//
// { domain: null,
//   _maxListeners: 10,
//   channel: 'cats',
//   port: 6379,
//   host: 'localhost',
//   meta:
//    { port: '6379',
//      host: 'localhost',
//      channel: 'cats',
//      socket_nodelay: true,
//      socket_keepalive: true },
//   json: true,
//   cli: [Object],
//   closed: true,
//   _close: [Function],
//   close: [Function] }
//

cats.on('message', function(coolCat){
  //
  // you got a message
  //
  console.log(coolCat);
});

cats.on('error', function(err) {
  console.log(err);
  //
  // close the subscriber on error
  //
  cats.close();
  pub.close();
});

var pub = new queue.Publish({
  //
  // adapter specific options
  //
});

pub.on('ready', function(){
  //
  // topic is a joi schema used to validate messages
  //
  var topic = {
    meow : Joi.string().required()
  };

  var channel = pub.channel('cats', {schema: topic});

  channel.publish({meow: 'yay'}, function () {
    channel.publish({woof: 'problem officer'}, console.log);
  });
});

//
// publisher events to listen to
//
pub.on('error', function(){});
pub.on('end',   function(){});
```
