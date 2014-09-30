# mqee

a standard interface to access message queues

``` javascript
var mqee = require('mqee')('amqp');

var sub = new mqee.Subscribe({
  channel: 'cats'
  //
  // adapter specific options
  //
});

sub.on('message', function(jsonObject){

});

sub.on('data', function(){});
sub.on('error', function(){});
sub.on('end', function(){});

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
var channel = pub.channel('cats', topic);

channel.write({"message": "ok"}, function (err) {
  //
  // your callback code here
  //
});

pub.close();
sub.close();
```

Wanted Adapters For: `couchdb`, `redis`, `amqp` (e.g. rabbitmq), `kafka`, `websockets`
