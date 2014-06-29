var ok = require('assert').equal;

var router = require('./..')();
router.on(function (socket, args, next) {
  //do something!
  next();
});
router.on(function (sock, args, next) {
  sock.emit('what', new Date);
  // this next won't do us any good the emit was already called.
  next();
  setTimeout(function () {
    sock.emit('what', new Date);
  }, 1000);
  sock.emit('what', new Date);
});

var io = require('socket.io')(3000);
io.use(router);
io.on('connection', function (socket) {
  // this won't get called because the "echo" event will be consumed!
  socket.on('echo', function (data) {
    socket.emit('echo', data);  
  });
});

setTimeout(function () {
  var client = require('socket.io-client').connect('ws://localhost:3000');
  client.on('connect', function () {
    client.emit('echo', 'data');
  });
  client.on('echo', function (data) {
    ok(data,'data');
    console.log('we good');
    process.exit();
  });
  var c = 0;
  client.on('what', function (data) {
    if (++c >= 3) {
      console.log('we good');
      process.exit();
    }
  });
},1000);
