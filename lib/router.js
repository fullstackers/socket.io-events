module.exports = Router;

function Router () {
  if (!(this instanceof Router)) return new Router();
  
  var self = this;

  var index = 0;

  this.index = function () {
    return ++index;
  };

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
  var points = [].concat(this.fns('*'));
  if (args && args.length && typeof args[0] === 'string' && args[0] !== '*') {
    points = points.concat(this.fns(args[0]));
  }
  var fns = [];
  points = points.sort(function (a, b) { return a[0] - b[0]; });
  points.forEach(function (point) {
    fns.push(point[1]);
  });
  return fns;
};

Router.prototype.on = function (name, fn) {
  var self = this;
  if (typeof name === 'function') {
    fn = name;
    name = '*';
  }
  else if (typeof name === 'object' && name instanceof Array) {
    var args = name;
    if (args.length) {
      var type = typeof name[0];
      if (type === 'string') {
        name = args.shift()
      }
      else if (type === 'function') {
        name = '*';
      }
      args.forEach(function (fn) {
        if (typeof fn === 'function') {
          self.on(name, fn);
        }
      });
    }
    return this;
  }

  this.fns(name).push([this.index(), fn]);
  
  return this;
};

Router.prototype.fns = function (name) {
  name = name || '*'
  if (!this._fns) {
    this._fns = {};
  }
  if (!this._fns[name]) {
    this._fns[name] = [];
  }
  return this._fns[name];
};

Router.prototype.on
