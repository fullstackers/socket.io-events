var router = require('./')();
router.on(function (sock, args, next) {
  console.log(args);
  next();
});
var io = require('socket.io')(3000);
io.use(router);
setTimeout(function () {
  var sock = require('socket.io-client').connect('ws://localhost:3000');
  sock.on('connect', function () {
    sock.emit('say');
  });
  sock.on('say', function () {
    process.exit(0);
  });
}, 1000);
