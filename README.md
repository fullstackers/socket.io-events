[![Build Status](https://travis-ci.org/turbonetix/socket.io-event-router.svg?branch=master)](https://travis-ci.org/turbonetix/socket.io-event-router)
[![NPM version](https://badge.fury.io/js/socket.io-event-router.svg)](http://badge.fury.io/js/socket.io-event-router)
[![David DM](https://david-dm.org/turbonetix/socket.io-event-router.png)](https://david-dm.org/turbonetix/socket.io-event-router.png)

**Router middleware for socket.io**

`npm install socket.io-event-router`

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


# Installation and Environment Setup

Install node.js (See download and install instructions here: http://nodejs.org/).

Install redis (See download and install instructions http://redis.io/topics/quickstart)

Clone this repository

    > git clone git@github.com:turbonetix/socket.io-event-router.git

cd into the directory and install the dependencies

    > cd bus.io
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
