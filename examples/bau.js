var ok = require('assert').equal;

var router = require('./..')();

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

setTimeout(function () {

  var client = require('socket.io-client').connect('ws://localhost:3000');
  client.on('connect', function () {
    client.emit('echo', 'data');
  });
  client.on('echo', function(data) {
    ok(data,'data');
    process.exit();
  });

},1000);
