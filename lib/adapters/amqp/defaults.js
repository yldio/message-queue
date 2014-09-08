'use strict';

var options = module.exports;

options.connection = {
  url: 'amqp://guest:guest@localhost:5672'
};

options.exchange = {
  name: 'Exchange',
  type: 'direct',
  durable: true,
  autoDelete: false
};

options.queue = {
  exclusive: false,
  durable: true,
  autoDelete: false
};

options.publish = {
  mandatory: false,
  persistent: true,
  deliveryMode: 2,
  contentType: 'application/json',
};
