#!/bin/sh
echo 'testing router'
node router
echo 'testing bau'
node bau
echo 'testing recover'
node recover
echo 'testing routers attached to routers'
node multiple
echo 'testing routers next to eachother'
node sibilings
echo 'testing event consumption'
node consume
