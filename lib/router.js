var debug = require('debug')('socket.io-events:router');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var emit = EventEmitter.prototype.emit;
var slice = Array.prototype.slice;

module.exports = Router;

/**
 * Binds a function to the socket.io socket #onevent method and pushes the 
 * event through middleware.
 *
 * @return Router
 */

function Router () {
  if (!(this instanceof Router)) return new Router();

  function router (socket, cb) {
    debug('router socket.id %s typeof cb %s', socket ? socket.id : null, typeof cb);
    router.middleware(socket, cb);
  }

  router.__proto__ = Router.prototype;

  var index = 0;

  /**
   * Inc the index
   *
   * @return Number
   */

  router.index = function () {
    return index++;
  };

  /**
   * The middleware function
   *
   * @api private
   * @param {Socket} socket
   * @param {function} cb
   */

  router.middleware = function (socket, cb) {
    debug('middleware socket.id %s typeof cb %s', (socket ? socket.id : null), typeof cb);
    if ('function' != typeof socket.onevent || socket.onevent !== router.onEvent) {
      if (socket.onevent && socket.onevent.router) {
        socket.onevent.router.use(router);
      }
      else {
        socket.onevent = router.onEvent;
      }
    }
    cb();
  };

  /**
   * Handles the packet and pushes it through the middleware.
   * When invoked "this" will be the socket.
   *
   * @api private
   * @param {Object} packet
   */

  router.onEvent = function (packet) {
    var args = packet.data || [];
    if (null != packet.id) {
      args.push(this.ack(packet.id));
    }
    router.onRoute(null, Socket(this), args);
  };

  /*
   * This will allow the onEvent method to chain it self when attaching
   * multiple routers side by side. e.g.
   *
   * var io = require('socket.io')(3000);
   * io.use(Router());
   * io.use(Router());
   */
  router.onEvent.router = router;

  /**
   * Pushes the socket and arguments through the middleware
   *
   * @api private
   * @param {Error} err *optional
   * @param {Socket} socket
   * @param {Array} args
   * @param {Function} cb
   */

  router.onRoute = function (err, socket, args, cb) {

    debug('onRoute err? %s socket.id %s args?', util.isError(err), (socket ? socket.id : null),  args);

    socket = router.decorate(socket, function (emit, args) { 
      debug('done callled'); 

      // set back to the old function
      if (socket.emit && socket.emit.emit) {
        debug('unwrapping the socket');
        socket.emit = socket.emit.emit;
      }
      
      socket.emit.done = true;

      emit.apply(socket, args); 
    });

    var i = 0, path = router.getPath(args.length ? args[0] : '*'), len = path.length;

    debug('got path the length is %s', len);

    (function step (err) {

      if (socket.emit.done) return;

      debug('current step %s of %s', i+1, len);

      function next (err) {
        if (++i >= len) {
          if (err) {
            if ('function' === typeof cb) {
              cb(err, socket, args);
            }
            else {
              emit.apply(socket, ['error', args]);
            }
          }
          else {
            if (socket.emit.done) return;
            if ('function' === typeof cb) {
              cb(null, socket, args);
            }
            else {
              emit.apply(socket, args);
            }
          }
        }
        else {
          step(err);
        }
      }

      var fn = path[i];
      if (!fn) return next();

      try {
        if (err) {
          if (fn.length >= 4) {
            if (fn instanceof Router) {
              fn.onRoute(err, socket, args, next);
            }
            else {
              fn(err, socket, args, next);
            }
          }
          else {
            next(err);
          }
        }
        else {
          if (fn.length >= 4) {
            if (fn instanceof Router) {
              fn.onRoute(null, socket, args, next);
            }
            else {
              next();
            }
          }
          else {
            if (fn instanceof Router) {
              fn.onRoute(null, socket, args, next);
            }
            else {
              fn(socket, args, next);
            }
          }
        }
      }
      catch(e) {
        debug('caught error %s', e);
        debug('the fn causing problems', fn);
        console.error(e.stack);
        next(e);
      }
      
    })(err);

  };
  
  return router;

};


/**
 * Decorates the socket's emit function to call the passed done method
 *
 * @api private
 * @param {Socket} socket
 * @param {function} done
 * @return Socket
 */

Router.prototype.decorate = function (socket, done) {
  debug('decorate socket.id %s typeof done %s', socket.id, typeof done);
  var emit = socket.emit;
 
  // prevent double wrapping
  if (emit.wrapped) return socket;

  socket.emit = function () {
    done(emit, slice.call(arguments));
  };

  socket.emit.emit = emit;
  socket.emit.wrapped = true;

  return socket;
};

/**
 * Gets the routing path given the name
 *
 * @api private
 * @param {String} name
 * @return Array
 */

Router.prototype.getPath = function (name) {
  debug('get path %s', name);
  name = name || '*';
  var fns = this._fns(), points = [], path = [];
  if (name === '*') {
    points = points.concat(fns[name]);
  }
  else {
    var keys = Object.keys(fns), i, key, match, regexp;
    for (i=0; i<keys.length; i++) {
      key = keys[i];
      if (util.isRegExp(key)) {
        regexp = key;
      }
      else {
        if (key.charAt(0) !== '/') {
          key = key.replace('*','.+');
        }
        else {
          key = key.slice(1, key.length-1);
        }
      }
      regexp = new RegExp(key);
      debug('regexp %s', regexp);
      match = String(name).match(regexp);
      if (match) {
        points = points.concat(fns[keys[i]]);
      }
    }
  }
  points
    .sort(function (a, b) { 
      return a[0] - b[0];
    })
    .forEach(function (point) {
      path.push(point[1]);
    });
  return path;
};

/**
 * Use this method to attach handlers, and other routers
 *
 * @api public
 * @param {mixed} Either a string and one of either a [function, or array of functions, or a Router]
 * @return Router
 */

Router.prototype.use = function () {
  if (!arguments.length) throw new Error('expecting at least one parameter');
  var args = slice.call(arguments);
  debug('use called %s', args);
  var name = typeof args[0] === 'string' || util.isRegExp(args[0]) ? args.shift() : '*';
  if (!args.length) throw new Error('we have the name, but need a handler');
  var fns = this.fns(name);
  for (var i=0; i<args.length; i++) {
    var arg = args[i];
    if (util.isArray(arg)) return this.use.apply(this, arg);
    if ('function' !== typeof arg) return;
    fns.push([this.index(), arg]);
  }
  return this;
};

/**
 * An alias to the `use` method.
 *
 * @api public
 * @param {mixed} Either a string, function, or array of functions
 * @return Router
 */

Router.prototype.on = Router.prototype.use;

/**
 * Gets the functions given the name.  Name will default to '*'
 *
 * @api private
 * @param {string} name
 * @return Array
 */

Router.prototype.fns = function (name) {
  name = name || '*';
  var _fns = this._fns();
  if (!_fns[name]) {
    _fns[name] = [];
  }
  return _fns[name];
};

/**
 * Gets the object that holds the points
 *
 * @api private
 * @return Object
 */

Router.prototype._fns = function () {
  if (!this.__fns) {
    this.__fns = {};
  }
  return this.__fns;
};

/**
 * Delegates to the socket.  Used to capture messages and prevent the
 * sock itself from being manipulated directly which is causing an issue
 * with events not being processed.
 *
 * TODO support other API methods
 *
 * @api private
 * @param {Socket} sock
 */

function Socket (sock) {
  if (!(this instanceof Socket)) return new Socket(sock);
  EventEmitter.call(this);
  this.sock = sock;
  this.domain = this.sock.domain;
  this.id = this.sock.id;
  this._events = this.sock._events;
  this._maxListeners = this.sock._maxListeners;
}

util.inherits(Socket, EventEmitter);

Socket.prototype.emit = function () {
  debug('debug wrapped');
  return this.sock.emit.apply(this.sock, slice.call(arguments));
};
