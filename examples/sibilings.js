// this is to show that routers next to eachother place nice
var ok = require('assert').equal;
var Router = require('../.');
var a = Router().use(function (sock, args, next) { args.push('Hello'); next(); });
var b = Router().use(function (sock, args, next) { args.push('World'); next(); });
var io = require('socket.io')(3000);
io.use(a);
io.use(b);
io.on('connection', function (sock) {
  sock.on('hi', function (hello, world) {
    sock.emit('hi', hello, world);
  });
});

setTimeout(function () {
  var sock = require('socket.io-client')('ws://localhost:3000');
  sock.on('connect', function () {
    sock.emit('hi');
  });
  sock.on('hi', function (hello, world) {
    ok('Hello', hello);
    ok('World', world);
    console.log('we good');
    process.exit(0);
  });
}, 1000);
