'use strict';

var adapter = process.env.ADAPTER || 'redis';

var mqee = require('../lib/mqee');
var Joi = mqee.Joi;
var fs = require('fs');
var queue = mqee(adapter);
var pub = queue.Publish();
var channel = pub.channel('cats', {schema: {meow : Joi.string().required()}});

channel.on('error', function(err) {
  console.error('err: ' + err);
});

fs.createReadStream(__dirname + '/meow.json-stream.txt')
  .pipe(channel);

setTimeout(pub.close, 200);
