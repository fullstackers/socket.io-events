var debug = require('debug')('router');
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

  function router (socket, cb) {
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

    router.onRoute(this, args);

  };

  /**
   * Pushes the socket and arguments through the middleware
   *
   * @api private
   * @param {Socket} socket
   * @param {Array} args
   */

  router.onRoute = function (socket, args) {

    var done = function (emit, args) {
      debug('done callled');
      emit.apply(socket, args);
    };

    var path = this.getPath(args.length ? args[0] : '*');

    debug('path %s, %s, [%s]', typeof path, (path || []).length, path);

    socket = this.decorate(socket, done);

    debug('socket %s', socket);

    var i = 0, len = path.length;

    (function step (err) {

      debug('current step %s of %s', i, len);

      function next (err) {
        debug('step err?', err ? true : false);
        if (++i >= len) {
          debug('last step'); 
          if (err) return emit.apply(socket, ['error', args]);
          return emit.apply(socket, args);
        }
        debug('step? %s', typeof step);
        step(err);
      }

      var fn = path[i];

      debug('fn?', typeof fn);

      debug('err?', typeof err);

      debug('next?', typeof next);

      try {
        debug('emit? %s', typeof emit);
        if (!fn) return emit.apply(socket, args);
        debug('we have a fn');
        if (!err) return fn(socket, args, next);
        debug('we have an error');
        if (fn.length >= 4) {
          debug('this fn has at least 4 arguments');
          fn(err, socket, args, next);
        }
        else {
          debug('this fn does not have at least 4 arguments');
          debug('next? %s', typeof next);
          next(err);
        }
      }
      catch(e) {
        debug('caught error %s', e);
        debug('the fn causing problems', fn);
        console.trace(e);
        next(e);
      }
      
    })();

  };
  
  return router;

}

/**
 * The middleware function
 *
 * @api private
 * @param {Socket} socket
 * @param {function} cb
 */

Router.prototype.middleware = function (socket, cb) {
  debug('middleware');
  if (socket.onevent !== this.onEvent) socket.onevent = this.onEvent;
  cb();
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
  debug('decorate');
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
 * @api private
 * @param {String} name
 * @return Array
 */

Router.prototype.getPath = function (name) {
  debug('get path %s', name);
  name = name || '*';
  var points = [].concat(this.fns(name));
  if (name !== '*') {
    points = points.concat(this.fns());
  }
  var fns = [];
  points
    .sort(function (a, b) { 
      var res = a[0] - b[0]; 
      debug('sort index a %s, b %s = %s', a, b, res);
      return res;
    })
    .sort(function (a, b) { 
      var res = (a[1].length >= 4 ? 1 : 0) - (b[1].length >= 4 ? 1 : 0); 
      debug('sort index a %s, b %s = %s', a, b, res);
      return res;
    })
    .forEach(function (point) {
      fns.push(point[1]);
    });
  return fns;
};

/**
 * Used to bind functions
 *
 * @api public
 * @param {mixed} Either a string, function, or array of functions
 * @return Router
 */

Router.prototype.on = function () {
  if (!arguments.length) throw new Error('expecting at least one parameter');

  var self = this;
  var args = Array.prototype.slice.call(arguments);
  var first = args.shift();
  var type = typeof first;
  var name = '*';
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
  debug('on %s %s', name, args.length );
  args.forEach(function (item) {
    if (typeof item !== 'function') return;
    var length = item.length;
    debug('fn length %s', length);
    self.fns(name).push([self.index(), item]);
  });

  return this;
};

/**
 * Gets the functions given the name.  Name will default to '*'
 *
 * @api private
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
