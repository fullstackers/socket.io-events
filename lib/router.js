var debug = require('debug')('router');
var emit = require('events').EventEmitter.prototype.emit;

module.exports = Router;

/**
 * Binds a function to the sock.io sock #onevent method and pushes the 
 * event through middleware.
 *
 * @return Router
 */

function Router () {
  if (!(this instanceof Router)) return new Router();

  function router (sock, cb) {
    router.middleware(sock, cb);
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
   * @param {Socket} sock
   * @param {function} cb
   */

  router.middleware = function (sock, cb) {
    debug('middleware');
    var type = typeof sock.onevent;
    if (type === 'function') {
      if (sock.onevent.isRouter) {

        // this is a bit of a mess, I know alreay.  It is so we can stack routers on top of 
        // each other.  Lets refactor this later.
        sock.onevent.stack = sock.onevent.stack || [];
        if (!sock.onevent.stack.next) {
          sock.onevent.stack.next = function (sock, args) {
            var step = this.shift();
            if ('function' === typeof step) {
              step(sock, args)
            }
            else {
              emit.apply(sock, args);
            }
          };
        }
        sock.onevent.stack.push(router.onRoute);
      }
      else {
        sock.onevent = router.onEvent;
      }
    }
    else if (type !== 'function') {
      sock.onevent = router.onEvent;
    }
    cb();
  };

  /**
   * Handles the packet and pushes it through the middleware.
   * When invoked "this" will be the sock.
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

  /*
   * Used to determine that the onEvent method is set. This is so we can have more than 
   * one or more router attached to it.
   */
  router.onEvent.isRouter = true;

  /**
   * Pushes the sock and arguments through the middleware
   *
   * @api private
   * @param {Socket} sock
   * @param {Array} args
   */

  router.onRoute = function (sock, args) {

    var done = function (emit, args) {
      debug('done callled');
      if (!sock.onevent.next) {
        emit.apply(sock, args);
      }
      else {
        sock.onevent.next();
      }
    };

    var path = this.getPath(args.length ? args[0] : '*');
    sock = this.decorate(sock, done);

    var i = 0, len = path.length;

    (function step (err) {

      debug('current step %s of %s', i, len);

      function next (err) {
        if (++i >= len) {
          debug('last step'); 
          if (err) return emit.apply(sock, ['error', args]);
          return emit.apply(sock, args);
        }
        step(err);
      }

      var fn = path[i];

      try {
        if (err) {
          if (fn.length >= 4) {
            fn(err, sock, args, next);
          }
          else {
            next(err);
          }
        }
        else {
          if (fn.length >= 4) {
            next();
          }
          else {
            fn(sock, args, next);
          }
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
 * Decorates the sock's emit function to call the passed done method
 *
 * @api private
 * @param {Socket} sock
 * @param {function} done
 * @return Socket
 */

Router.prototype.decorate = function (sock, done) {
  debug('decorate');
  var emit = sock.emit;
 
  // prevent double wrapping
  if (emit.wrapped) return sock;

  sock.emit = function () {
    done(emit, Array.prototype.slice.call(arguments));
  };

  sock.emit.wrapped = true;

  return sock;
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
