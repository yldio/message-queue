'use strict';

var Joi = require('joi');
var async = require('async');
var queue = require('../lib/mqee')('redis');
var pub = queue.Publish();

pub.on('ready', function() {
  var channel = pub.channel(
    'cats',
    {
      schema: {
        meow : Joi.string().required()
      }
    });

  async.series([
    function(ack) {
      setTimeout(function() {
        channel.publish({meow: 'yay'}, ack);
      }, 1000);
    }/*,
    function(ack) {
      debugger
      channel.publish({woof: 'problem officer'}, ack);
    }*/
  ], function onEnd(err, data) {
    console.log(arguments);
    console.log(err ? err.message : data);
    pub.close();
  });
});
