var router = require('./')();
router.on(function (sock, args, next) {
  console.log(args);
  next();
});
var io = require('socket.io')(3001);
io.use(router);
io.on('connect', function (sock) {
  sock.on('say', function () {
    sock.emit('say');
  });
});
setTimeout(function () {
  var sock = require('socket.io-client').connect('ws://localhost:3001');
  sock.on('connect', function () {
    sock.emit('say');
  });
  sock.on('say', function () {
    console.log('got say');
    process.exit(0);
  });
}, 1000);
