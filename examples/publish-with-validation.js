'use strict';

var adapter = process.env.ADAPTER || 'redis';

var Joi = require('joi');
var async = require('async');
var queue = require('../lib/mqee')(adapter);
var pub = queue.Publish();

pub.on('ready', function() {
  console.log('connected');
});

//
// schema to validate our messages
//
var channel = pub.channel('cats', {
  schema: {
    meow : Joi.string().required()
  }
});

async.series([
  function(ack) {
    //
    // this will publish cause it includes required
    // `meow` which is a string
    //
    channel.publish({meow: 'yay'}, ack);
  },
  function(ack) {
    //
    // this will fail because it does not
    // include the required `meow`
    //
    channel.publish({woof: 'problem officer'}, ack);
  }
], function onEnd(err, data) {
  console.log(err ? err.message : data);
  //
  // avoid closing the socket
  // before everything has been written
  //
  // @see #6
  //
  setTimeout(pub.close, 200);
});
