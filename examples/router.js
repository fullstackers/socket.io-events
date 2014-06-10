var ok = require('assert').equal;

var router = require('./..')();

// gets all events here
router.on(function (socket, args, next) {
  next();
});

// gets 'some event'
router.on('some event', function (socket, args, next) {
  next();
});

// gets all events
router.on(function (socket, args) {

  //emits back to the client
  socket.emit(args.shift(), args);
});

router.on(function (socket, args) {
  console.log('you wont see this happen, beacuse the last handler called "emit"');
});

var io = require('socket.io')(3000);
io.use(router.middleware);

setTimeout(function () {

  var client = require('socket.io-client').connect('ws://localhost:3000');
  client.on('connect', function () {
    client.emit('some event', 'data');
  });
  client.on('some event', function(data) {
    ok(data,'data');
    process.exit();
  });

},1000);
