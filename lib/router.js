module.exports = Router;

function Router () {
  if (!(this instanceof Router)) return new Router();
  
  var self = this;

  this.middleware = function (socket, cb) {
    socket.onevent = self.onEvent;
    cb();
  };

  this.onEvent = function (packet) {

    var args = packet.data || [];

    if (null != packet.id) {
      args.push(this.ack(packet.id));
    }

    self.onRoute(this, args);

  };

  this.onRoute = function (socket, args) {

    var done = function (emit, args) {
      emit.apply(socket, args);
    };

    var path = this.getPath(args);

    socket = this.decorate(socket, done);

    var i = 0;

    (function next () {

      path[i](socket, args, function (err) {
        if (err) throw err;
        if (++i >= path.length) {
          console.log('socket', socket);
          return socket.emit.apply(socket, args);
        }
        next();
      });

    })();

  };

}

Router.prototype.decorate = function (socket, done) {
  var emit = socket.emit;

  socket.emit = function () {
    done(emit, Array.prototype.slice.call(arguments));
  };

  return socket;
};

Router.prototype.getPath = function (args) {
  return [];
}

