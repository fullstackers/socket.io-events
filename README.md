[![Build Status](https://travis-ci.org/turbonetix/socket.io-events.svg?branch=master)](https://travis-ci.org/turbonetix/socket.io-events)
[![NPM version](https://badge.fury.io/js/socket.io-events.svg)](http://badge.fury.io/js/socket.io-events)
[![David DM](https://david-dm.org/turbonetix/socket.io-events.png)](https://david-dm.org/turbonetix/socket.io-events.png)

Power your [socket.io](https://github.com/Automattic/socket.io "socket.io") apps with [express](https://github.com/visionmedia/express "express") like `event` routing.

```javascript
var assert = require('assert');
var router = require('socket.io-events')();

// handles all events
router.on(function (socket, args, next) {
  next();
});

// handles events named 'some event'
router.on('some event', function (socket, args, next) {
  assert.equal(args[0], 'some event');
  next();
});

// handles all events
router.on(function (socket, args) {
  //emits back to the client, and ends the chain.  
  //Think `res.end()` for express.
  socket.emit(args.shift(), args);
});

router.on(function (socket, args) {
  //this wont fire because socket.emit() 
  //has been called which is like `res.end()` in express.
});

var io = require('socket.io')(3000);
io.use(router);
```

Here is an example of *not* handling a message and letting [socket.io](https://github.com/Automattic/socket.io "socket.io")
handle things *business as usual*.

```javascript

var router = require('socket.io-events')();
router.on(function (socket, args, next) {
  //do something!
  next();
});

var io = require('socket.io')(3000);
io.use(router);
io.on('connection', function (socket) {
  socket.on('echo', function (data) {
    socket.emit('echo', data);  
  });
});
```

Here is an example of calling `next()` with an `Error` object, and having an error handler capture it.

```javascript
var router = require('socket.io-events')();

router.on('some event', function (socket, args, next) {
  next(new Error('something wrong');
});

router.on(function (err, socket, args, next) {
  socket.emit('error', err);
});
```

You can recover from an error too.

```javascript
var router = require('socket.io-events')();

router.on('some event', function (socket, args, next) {
  next(new Error('something wrong');
});

router.on(function (err, socket, args, next) {
  //I handled the error so continue to the next middleware.
  next();
});

router.on(function (socket, args, next) {
  //I recovered from the error.
  next();
});

io.use(router);
```

# Installation and Environment Setup

Install node.js (See download and install instructions here: http://nodejs.org/).

Clone this repository

    > git clone git@github.com:turbonetix/socket.io-events.git

cd into the directory and install the dependencies

    > cd socket.io-eventst
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
