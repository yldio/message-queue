#!/bin/bash

case "$1" in
  redis)
    sudo service redis_6379 stop
    sleep 1
    sudo service redis_6379 start
  ;;
  amqp)
    sudo service rabbitmq-server restart
  ;;
  *)
    exit 1
  ;;
esac