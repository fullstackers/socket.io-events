var ok = require('assert').equal;

var router = require('./..')();

// handle all events here
router.on(function (socket, args, next) {
  next();
});

// handle events named 'some event'
router.on('some event', function (socket, args, next) {
  ok(args[0],'some event');
  next();
});

// handle all events
router.on(function (socket, args) {
  //emits back to the client
  socket.emit(args.shift(), args);
});

router.on(function (socket, args) {
  //this wont fire because socket.emit() has been called which is like `res.end()` in express.
});

var io = require('socket.io')(3000);
io.use(router);

setTimeout(function () {
  var client = require('socket.io-client').connect('ws://localhost:3000');
  client.on('connect', function () {
    client.emit('some event', 'data');
  });
  client.on('some event', function(data) {
    ok(data,'data');
    console.log('we good');
    process.exit();
  });
},1000);
