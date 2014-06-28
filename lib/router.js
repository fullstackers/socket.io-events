var debug = require('debug')('router');
var util = require('util');
var emit = require('events').EventEmitter.prototype.emit;
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
    debug('middleware socket.id %s typeof cb %s', socket.id, typeof cb);
    if ('function' != typeof socket.onevent || socket.onevent !== router.onEvent) {
      debug('the socket does not have the onEvent method attached yet');
      if (socket.onevent && socket.onevent.router) {
        debug('the socket\'s onevent method is an onEvent method that has a router so lets attach to it');
        socket.onevent.router.use(router);
      }
      else {
        debug('the onevent method is NOT a router method');
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

    router.onRoute(null, this, args);

  };

  /*
   * This will allow the onEvent method to chain it self when attaching
   * multiple routers side by side. e.g.
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

    socket = router.decorate(socket, function (emit, args) { debug('done callled'); emit.apply(socket, args); });

    var i = 0, path = router.getPath(args.length ? args[0] : '*'), len = path.length;

    debug('got path the length is %s', len);

    debug('about to call "step" for the first time passing %s for err', err);

    (function step (err) {

      debug('current step %s of %s', i+1, len);

      function next (err) {
        debug('next called err? %s', util.isError(err));
        if (++i >= len) {
          debug('last step'); 
          if (err) {
            debug('has err');
            if ('function' === typeof cb) {
              debug('cb is function');
              cb(err, socket, args);
            }
            else {
              debug('default which is to call emit on the socket');
              emit.apply(socket, ['error', args]);
            }
          }
          else {
            debug('no err');
            if ('function' === typeof cb) {
              debug('cb is function');
              cb(null, socket, args);
            }
            else {
              debug('default which is to call emit on the socket');
              emit.apply(socket, args);
            }
          }
        }
        else {
          debug('calling step');
          step(err);
        }
      }

      var fn = path[i];
      if (!fn) return next();

      debug('typeof fn? %s', typeof fn);

      try {
        if (err) {
          debug('we have an error');
          if (fn.length >= 4) {
            debug('the fn.length is >= 4');
            if (fn instanceof Router) {
              debug('we have a router instance');
              fn.onRoute(err, socket, args, next);
            }
            else {
              debug('we have a regular function');
              fn(err, socket, args, next);
            }
          }
          else {
            debug('fn is not an erorr handler call next %s', typeof next);
            next(err);
          }
        }
        else {
          debug('we do not have an error');
          debug('fn %s', fn);
          if (fn.length >= 4) {
            debug('the fn.length is >= 4');
            if (fn instanceof Router) {
              debug('we have a router instance');
              fn.onRoute(null, socket, args, next);
            }
            else {
              debug('we have a regular function call next %s', typeof next);
              next();
            }
          }
          else {
            if (fn instanceof Router) {
              debug('we have a router instance');
              fn.onRoute(null, socket, args, next);
            }
            else {
              debug('fn is normal invoke it socket.id %s args %s typeof next %s', (socket ? socket.id : null), args, typeof next);
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

  debug('router instanceof Router? %s', router instanceof Router);
  
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

  debug('is the "emit" on socket.id %s wrapped? %s', socket.id, (emit.wrapped ? true : false));
 
  // prevent double wrapping
  if (emit.wrapped) return socket;

  socket.emit = function () {
    done(emit, slice.call(arguments));
  };

  debug('"emit" on socket.id %s is now wrapped', socket.id);
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
  var fns = this._fns();
  var points = [].concat(fns[name] || []);
  if (name !== '*') {
    var fns = this._fns(), keys = Object.keys(fns), i, key, match, regexp;
    debug('keys "%s"', keys);
    for (i=0; i<keys.length; i++) {
      key = keys[i];
      if (!util.isRegExp(key)) key = '^'+key.replace('*','.+');
      debug('key "%s"', key);
      regexp = new RegExp(key);
      debug('matching "%s" to regexp %s', name, regexp);
      match = String(name).match(regexp);//.exec(name);
      debug('match "%s" for "%s"', match, key);
      if (match) {
        points = points.concat(fns[keys[i]]);
      }
    }
  }
  var fns = [];
  points
    .sort(function (a, b) { 
      return a[0] - b[0];
    })
    .forEach(function (point) {
      fns.push(point[1]);
    });
  return fns;
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
  var name = typeof args[0] === 'string' ? args.shift() : '*';
  debug('the name %s', name);
  if (!args.length) throw new Error('we have the name, but need a handler');
  var fns = this.fns(name);
  var self = this;
  var i, arg, type;
  for (i=0; i<args.length; i++) {
    arg = args[i];
    if (util.isArray(arg)) return self.use.apply(self, arg);
    type = typeof arg;
    debug('typeof arg %s', type);
    if ('function' !== type) return;
    debug('arg instanceof Router? %s', arg instanceof Router);
    fns[fns.length] = [self.index(), arg];
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
