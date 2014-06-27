var ok = require('assert').equal;
var Router = require('./..');

var a = Router();
a.on('say', function (sock, args, next) { args.push('World'); next() });

var b = Router();
b.use(function (sock, args, next) { sock.emit('done', args.pop(), args.pop()); });

a.use(b)

var io = require('socket.io')(3000);
io.use(a);

setTimeout(function () {
  var sock = require('socket.io-client').connect('ws://localhost:3000');
  sock.on('connect', function () {
    sock.emit('say', 'Hello');
  });
  sock.on('done', function (hello, world) {
    ok(hello, 'Hello');
    ok(world, 'World');
    console.log('we good');
    process.exit(0);
  });

}, 1000);
