var ok = require('assert').equal;

var router = require('./..')();

// handle all events here
router.on(function (socket, args, next) {
  next();
});

// gets 'some event'
router.on('some event', function (socket, args, next) {
  next(new Error('something wrong'));
});

// handle the error
router.on(function (err, socket, args, next) {
  //handled the error!
  next();
});

// handle all events
router.on(function (socket, args) {
  //emits back to the client
  socket.emit(args.shift(), args);
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
