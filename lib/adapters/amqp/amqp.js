'use strict';

var amqpjs = require('amqpjs');

//
//  same URI we should use the
//  same connection
//

var connections = {};

module.exports = amqp;

function amqp(uri, socketOptions, fnError) {
  if (!connections[uri]) {
    connections[uri] = amqpjs(uri, socketOptions);
    connections[uri].on('error', fnError);
    connections[uri]._size = 1;

    // instead of call amqpjs.close directly
    // we must ensure we don't close the connection
    // with active channels
    connections[uri].destroyClient = function(cb) {
      if (connections[uri]._size > 1) {
        return cb();
      } else {
        return connections[uri].close(cb);
      }
    };
  } else {
    connections[uri]._size++;
  }

  return connections[uri];
}
