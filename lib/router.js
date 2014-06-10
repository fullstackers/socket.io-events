var emit = require('events').EventEmitter.prototype.emit;

module.exports = Router;

/**
 * Binds a function to the socket.io socket #onevent method and pushes the 
 * event through middleware.
 *
 * @return Router
 */

function Router () {
  if (!(this instanceof Router)) return new Router();
  
  var self = this;

  var index = 0;

  /**
   * Inc the index
   * @return Number
   */

  this.index = function () {
    return index++;
  };

  /**
   * The middleware function
   *
   * @param {Socket} socket
   * @param {function} cb
   */
  
  this.middleware = function (socket, cb) {
    socket.onevent = self.onEvent;
    cb();
  };

  /**
   * Handles the packet and pushes it through the middleware.
   * When invoked "this" will be the socket.
   *
   * @param {Object} packet
   */

  this.onEvent = function (packet) {

    var args = packet.data || [];

    if (null != packet.id) {
      args.push(this.ack(packet.id));
    }

    self.onRoute(this, args);

  };

  /**
   * Pushes the socket and arguments through the middleware
   *
   * @param {Socket} socket
   * @param {Array} args
   */

  this.onRoute = function (socket, args) {

    var done = function (emit, args) {
      emit.apply(socket, [args.shift()].concat(args.shift()));
    };

    var path = this.getPath(args.length ? args[0] : '*');

    path.push(function (socket, args) {
      emit.apply(socket, args);
    });

    socket = this.decorate(socket, done);

    var i = 0;

    (function next () {

      path[i](socket, args, function (err) {
        if (err) throw err;
        if (++i >= path.length) {
          return socket.emit.apply(socket, args);
        }
        next();
      });

    })();

  };

}

/**
 * Decorates the socket's emit function to call the passed done method
 *
 * @param {Socket} socket
 * @param {function} done
 * @return Socket
 */

Router.prototype.decorate = function (socket, done) {
  var emit = socket.emit;
 
  // prevent double wrapping
  if (emit.wrapped) return socket;

  socket.emit = function () {
    done(emit, Array.prototype.slice.call(arguments));
  };

  socket.emit.wrapped = true;

  return socket;
};

/**
 * Gets the routing path given the name
 *
 * @param {String} name
 * @return Array
 */

Router.prototype.getPath = function (name) {
  name = name || '*';
  var points = [].concat(this.fns(name));
  if (name !== '*') {
    points = points.concat(this.fns());
  }
  var fns = [];
  points = points.sort(function (a, b) { return a[0] - b[0]; });
  points.forEach(function (point) {
    fns.push(point[1]);
  });
  return fns;
};

/**
 * Used to bind functions
 *
 * @param {mixed} Either a string, function, or array of functions
 * @return Router
 */

Router.prototype.on = function () {
  if (!arguments.length) throw new Error('expecting at least one parameter');

  var self = this;
  var args = Array.prototype.slice.call(arguments);
  var first = args.shift();
  var type = typeof first
  var name = '*'
  var fn;

  if (type === 'string') {
    name = first;
    if (!args.length) throw new Error('need a function');
  }
  else if (type === 'function') {
    fn = first;
    this.fns(name).push([this.index(), first]);
  }
  else if (type === 'object' && first instanceof Array) {
    this.on.apply(this, first);
  }
  args.forEach(function (item) {
    if (typeof item === 'function')
      self.fns(name).push([self.index(), item]);
  });

  return this;
};

/**
 * Gets the functions given the name.  Name will default to '*'
 *
 * @param {string} name
 * @return Array
 */

Router.prototype.fns = function (name) {
  name = name || '*';
  if (!this._fns) {
    this._fns = {};
  }
  if (!this._fns[name]) {
    this._fns[name] = [];
  }
  return this._fns[name];
};
