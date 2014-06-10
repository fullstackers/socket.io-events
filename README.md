[![Build Status](https://travis-ci.org/turbonetix/socket.io-event-router.svg?branch=master)](https://travis-ci.org/turbonetix/socket.io-event-router)
[![NPM version](https://badge.fury.io/js/socket.io-event-router.svg)](http://badge.fury.io/js/socket.io-event-router)
[![David DM](https://david-dm.org/turbonetix/socket.io-event-router.png)](https://david-dm.org/turbonetix/socket.io-event-router.png)

**Routing middleware for [socket.io](https://github.com/Automattic/socket.io "socket.io")**

Here is an example of routing an event through middleware.

```javascript

var router = require('socket.io-event-router')();

// gets all events here
router.on(function (socket, args, next) {
  next();
});

// gets 'some event'
router.on('some event', function (socket, args, next) {
  next();
});

// gets all events
router.on(function (socket, args) {

  //emits back to the client
  socket.emit(args.shift(), args);
});

router.on(function (socket, args) {
  console.log('you wont see this happen, beacuse the last handler called "emit"');
});

var io = require('socket.io')(3000);
io.use(router.middleware);

```

Here is an example of *not* handling a message and letting [socket.io](https://github.com/Automattic/socket.io "socket.io")
handle things *business as usual*.

```javascript

var router = require('socket.io-event-router')();

router.on(function (socket, args, next) {
  //do something!
  next();
});

var io = require('socket.io')(3000);
io.use(router.middleware);
io.on('connection', function (socket) {
  socket.on('echo', function (data) {
    socket.emit('echo', data);  
  });
});

```

# Installation and Environment Setup

Install node.js (See download and install instructions here: http://nodejs.org/).

Install redis (See download and install instructions http://redis.io/topics/quickstart)

Clone this repository

    > git clone git@github.com:turbonetix/socket.io-event-router.git

cd into the directory and install the dependencies

    > cd socket.io-event-router
    > npm install && npm shrinkwrap --dev

# Running Tests

Install coffee-script

    > npm install coffee-script -g

Tests are run using grunt.  You must first globally install the grunt-cli with npm.

    > sudo npm install -g grunt-cli

## Unit Tests

To run the tests, just run grunt

    > grunt spec

## TODO

1) Support regex or some other kind of pattern matching other thang string literals
