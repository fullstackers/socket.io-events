var debug = require('debug')('router');
var ok = require('assert').equal;
var Router = require('./..');

var a = Router();
a.on('say', function (sock, args, next) {
  debug('World');
  args.push('World');
  next();
});

var b = Router();
b.use('say', function (sock, args, next) { 
  debug('Good');
  args.push('Good'); 
  next();
});

var c = Router();
c.use('say', function (sock, args, next) { 
  debug('Bye');
  args.push('Bye');
  next();
});

var d = Router();
d.use(function (sock, args, next) { 
  debug('!!!');
  args.push('!!!');
  next();
});

a.use(b)
b.use(c);
c.use(d);

var io = require('socket.io')(3000);
io.use(a);
io.on('connection', function (sock) {
  sock.on('say', function (hello, world, good, bye, exclamation) {
    debug('the socket emit function????', sock.emit.toString());
    sock.emit('say', hello, world, good, bye, exclamation);
  });
});

setTimeout(function () {
  var sock = require('socket.io-client').connect('ws://localhost:3000');
  sock.on('connect', function () {
    sock.emit('say', 'Hello');
  });
  sock.on('say', function (hello, world, good, bye, exclamation) {
    ok(hello, 'Hello');
    ok(world, 'World');
    ok(good, 'Good');
    ok(bye, 'Bye');
    ok(exclamation, '!!!');
    console.log('we good');
    process.exit(0);
  });

}, 1000);
