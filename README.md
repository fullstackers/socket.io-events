[![Build Status](https://travis-ci.org/turbonetix/socket.io-events.svg?branch=master)](https://travis-ci.org/turbonetix/socket.io-events)
[![NPM version](https://badge.fury.io/js/socket.io-events.svg)](http://badge.fury.io/js/socket.io-events)
[![David DM](https://david-dm.org/turbonetix/socket.io-events.png)](https://david-dm.org/turbonetix/socket.io-events.png)

Power your [socket.io](https://github.com/Automattic/socket.io "socket.io") apps with [express](https://github.com/visionmedia/express "express") like `event` routing.

`$ npm install socket.io-events`

```javascript
var io = require('socket.io')(3000);
var router = require('socket.io-events')();
router.on('*', function (sock, args, next) {
  var name = args.shift(), msg = args.shift();
  sock.emit('received event', name, msg);
});
io.use(router);
```

# Features

* Easy to use interface for manipulating socket.io events.
* Express-like routing capabilties for socket.io events.
* Gives you more control over how events are handled.
* Attach `Router` instances to other `Router` instances.
* Support for "wildcard" (*) and Regular Expression matching.
* Event consumption and propagation.

# Examples

The method `on` is an alias to `use`.

```javascript
var assert = require('assert');
var router = require('socket.io-events')();

// handles all events
router.on(function (socket, args, next) {
  next();
});

// handles all events too
router.on('*', function (socket, args, next) {
  next();
});

// handles events matching 'some*'
router.on('some*', function (socket, args, next) {
  next();
});

// handles events matching '*events'
router.on('*event', function (socket, args, next) {
  next();
});

// handle events matching /^\w+/ 
router.on(/^\w+/, function (socket, args, next) {
  next();
});

// handles all events
router.on(function (socket, args) {
  //emits back to the client, and ends the chain.  
  //Think `res.end()` for express.
  //calling `emit()` consumes the event which means no other handlers
  //get a chance to process it.
  socket.emit(args.shift(), args);
});

router.on(function (socket, args) {
  //this wont fire because socket.emit() 
  //has been called which is like `res.end()` in express.
});

var io = require('socket.io')(3000);
io.use(router);
```

Here is an example of *not* consuming the event and letting [socket.io](https://github.com/Automattic/socket.io "socket.io")
handle things *business as usual*.

```javascript

var router = require('socket.io-events')();
router.on(function (socket, args, next) {
  //do something, but don't consume it.
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

You can even attach a `Router' intance to another `Router` intance.

```javascript
var Router = require('socket.io-events')();

var a = Router();
a.use(function (sock, args, next) { next() });

var b = Router();
b.use(function (sock, args, next) { next() });

a.use(b)

var io = require('socket.io')(3000);
io.use(a);
```

# API

## Router

Get the `Router` class.

```javascript
var Router = require('socket.io-events');
```

The `use` and `on` methods are equivalent.  They also can be chained.

```javascript
var router = Router()
  .use(function (sock, args, next) { })
  .use(function (sock, args, next) { })
  .use(function (sock, args, next) { });
```

### Router#()

Make a `Router` instance

```javascript
var router = Router();
```

### Router#use(fn:Function, ...)

Attach a `function` to the router.

```javascript
router.use(function (sock, args, next) {
  //do something!
  next();
});
```

You can pass in multiple `function`s.

```javascript
var a = function (sock, args, next) { next() };
var b = function (sock, args, next) { next() };
var c = function (sock, args, next) { next() };

router.use(a,b,c); 
```

You can pass in a function that accepts an `Error` object.

```javascript
router.use(function (err, sock, args, next) {
  console.error(err);
  
  //calling next(err) will invoke the next error handler.
  //to resume operation just call next()
  next(err);
});
```

### Router#use(event:String, fn:Function, ...)

Bind the `function` to the `event`.

```javascript
router.use('chat', function (sock, args, next) {
  assert.equal(args[0], 'chat');
  args[1] = args[1].length > 128 ? args[1].slice(0, 125) + '...' : args[1];
  next();
});
```

You can also pass in multiple `function`s for handling the `event`.

```javascript
var chop = function (sock, args, next) { next() };
var clean = function (sock, args, next) { next() };
var pretty = function (sock, args, next) { next() };

router.use('chat', chop, clean, pretty);
```

### Router#use(event:RegExp, fn:Function, ...)

Bind the `function` using a `RegExp` pattern to match the `event`.

```javascript
router.use(/\w+/, function (sock, args, next) {
  assert.equal(args[0], 'chat');
  args[1] = args[1].length > 128 ? args[1].slice(0, 125) + '...' : args[1];
  next();
});
```

You can also pass in multiple `function`s for handling the `event`.

```javascript
var chop = function (sock, args, next) { next() };
var clean = function (sock, args, next) { next() };
var pretty = function (sock, args, next) { next() };

router.use(/\w+/, chop, clean, pretty);
```

### Router#use(router:Router, ...)

You can attach another `Router` instance to your `Router` instance.

```javascript
var another = Router();
another.use(function (sock, args, next) { next(); });

router.use(another);
```

Attach multiple routers in a single call.

```javascript
var foo = Router();
foo.use(function (sock, args, next) { next(); });

var bar = Router();
bar.use(function (sock, args, next) { next(); });

var baz = Router();
baz.use(function (sock, args, next) { next(); });

router.use(foo, bar, baz);
```

### Router#use(name:String, router:Router, ...)

Just like attaching a `function` to the router given the `event`.  You can attach `Router`
instance as well to the `event`.

```javascript
var foo = Router();
foo.use(function (sock, args, next) { next(); });

router.use('some event', foo);
```

Attach multiple routers in a single call to the `event` too.

```javascript
var foo = Router();
foo.use(function (sock, args, next) { next(); });

var bar = Router();
bar.use(function (sock, args, next) { next(); });

var baz = Router();
baz.use(function (sock, args, next) { next(); });

router.use('some event', foo, bar, baz);
```

### Router#use(fns:Array, ...)

Attach an `Array` of `Fuction`'s or `Router` instances, or an `Array` or `Array`s .

```javascript
var middleware = [
  function (sock, args, next) { next(); },
  [
    function (sock, args, next) { next(); },
    Router().use(function (sock, args, next) { next(); }),
    function (sock, args, next) { next(); },
  ],
  Router().use(function (sock, args, next) { next(); })
];

var errHandler = function (err, sock, args, next) { next(err); } 

router.use(middleware, errHandler);
```

### Router#use(name:String, fns:Array, ...)

Attach everything to an event.

```javascript
var middleware = [
  function (sock, args, next) { next(); },
  [
    function (sock, args, next) { next(); },
    Router().use(function (sock, args, next) { next(); }),
    function (sock, args, next) { next(); },
  ],
  Router().use(function (sock, args, next) { next(); })
];

var errHandler = function (err, sock, args, next) { next(err); } 

router.use('only this event', middleware, errHandler);
```

### Router#on(...)

This is an alias to to the `use` method.  It does the same thing.

```javascript
router.on(function (sock, args, next) { next() });
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
