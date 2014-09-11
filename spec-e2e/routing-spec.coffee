debug = require('debug')('router')

describe 'routing events', ->

  describe 'when a router receives some event it should route it to a handler', ->

    Given -> @foo = jasmine.createSpy 'foo'
    Given -> @bar = jasmine.createSpy 'bar'
    Given -> @baz = jasmine.createSpy 'baz'
    Given -> @no = jasmine.createSpy 'no'
    Given ->
      @router = require('./..')()
      @router.on (socket, args, next) =>
        @foo()
        next()
      @router.on 'some event', (socket, args, next) =>
        @bar()
        next()
      @router.on '*', (socket, args, next) =>
        @baz()
        socket.emit.apply(socket, args)
      @router.on 'some event', (socket, args, next) =>
        @no()
        next()

    Given ->
      @io = require('socket.io')(3000)
      @io.use @router.middleware

    Given -> @message = 'Hello, World'

    When (done) ->
      @socket = require('socket.io-client').connect('ws://localhost:3000')
      @socket.on 'connect', =>
        @socket.emit 'some event', @message
      @socket.on 'some event', (message) =>
        @res = message
        done()

    Then -> expect(@res).toEqual @message
    And -> expect(@baz).toHaveBeenCalled()
    And -> expect(@bar).toHaveBeenCalled()
    And -> expect(@foo).toHaveBeenCalled()
    And -> expect(@no).not.toHaveBeenCalled()

  describe 'when a router receives some event and it is not handle business as usual', ->

    Given ->
      @router = require('./..')()
      @router.on (socket, args, next) -> next()

    Given ->
      @io = require('socket.io')(3001)
      @io.use @router.middleware
      @io.on 'connect', (socket) ->
        socket.on 'echo', (data) ->
          socket.emit 'echo', data

    Given -> @message = 'Hello, World'

    When (done) ->
      @socket = require('socket.io-client').connect('ws://localhost:3001')
      @socket.on 'connect', =>
        @socket.emit 'echo', @message
      @socket.on 'echo', (message) =>
        @res = message
        done()
    Then -> expect(@res).toEqual @message

  describe 'two routers connected to each other', ->

    Given -> @hit = 0

    Given ->
      @a = require('./..')()
      @a.on (socket, args, next) =>
        debug('handler "a" socket.id %s args %s typeof next', socket.id, args, typeof next)
        @hit++
        next()

    Given ->
      @b = require('./..')()
      @b.on (socket, args, next) =>
        debug('handler "b" socket.id %s args %s typeof next', socket.id, args, typeof next)
        @hit++
        next()

    Given -> @a.use @b

    Given ->
      @io = require('socket.io')(3002)
      @io.use @a
      @io.on 'connect', (socket) ->
        socket.on 'echo', (data) ->
          socket.emit 'echo', data

    Given -> @message = 'Hello, World'

    When (done) ->
      @socket = require('socket.io-client').connect('ws://localhost:3002')
      @socket.on 'connect', =>
        @socket.emit 'echo', @message
      @socket.on 'echo', (message) =>
        @res = message
        done()
    Then -> expect(@res).toEqual @message
    And -> expect(@hit).toBe 2

  describe 'two routers side by side should dwork together', ->

    Given ->
      @a = require('./..')()
      @a.on (socket, args, next) =>
        args.pop()
        debug('handler "a" socket.id %s args %s typeof next', socket.id, args, typeof next)
        args.push('play')
        next()

    Given ->
      @b = require('./..')()
      @b.on (socket, args, next) =>
        debug('handler "b" socket.id %s args %s typeof next', socket.id, args, typeof next)
        args.push('nice')
        next()

    Given ->
      @io = require('socket.io')(3003)
      @io.use @a
      @io.use @b
      @io.on 'connect', (socket) ->
        socket.on 'echo', (play, nice) ->
          socket.emit 'echo', play, nice

    When (done) ->
      @socket = require('socket.io-client').connect('ws://localhost:3003')
      @socket.on 'connect', =>
        @socket.emit 'echo', @message
      @socket.on 'echo', (play, nice) =>
        @res = play + ' ' + nice
        done()

     Then -> expect(@res).toEqual 'play nice'

  describe 'should support wild cards and regex', ->

    Given -> @hit = 0

    Given ->
      @a = require('./..')()
      @a.on 'some*', (sock, args, next) =>
        @hit++
        next()
      @a.on '*event', (sock, args, next) =>
        @hit++
        next()
      @a.on /^\w+\s/, (sock, args, next) =>
        @hit++
        next()

    Given ->
      @io = require('socket.io')(3004)
      @io.use @a
      @io.on 'connect', (socket) ->
        socket.on 'some event', ->
          socket.emit 'some event', new Date

    When (done) ->
      @socket = require('socket.io-client').connect('ws://localhost:3004')
      @socket.on 'connect', =>
        @socket.emit 'some event'
      @socket.on 'some event', ->
        done()

    Then -> expect(@hit).toBe 3

  describe 'should handle multiple events', ->

    Given -> @hit = 0

    Given ->
      @a = require('./..')()
      @a.on 'some*', (sock, args, next) =>
        @hit++
        next()
      @a.on '*event', (sock, args, next) =>
        @hit++
        next()
      @a.on /^\w+\s/, (sock, args, next) =>
        @hit++
        next()

    Given ->
      @io = require('socket.io')(3005)
      @io.use @a
      @io.on 'connect', (socket) ->
        socket.on 'some event', ->
          socket.emit 'some event', new Date

    When (done) ->
      @socket = require('socket.io-client').connect('ws://localhost:3005')
      @socket.on 'connect', =>
        @a = 0
        @socket.emit 'some event'
        @socket.emit 'some event'
        @socket.emit 'some event'
      @socket.on 'some event', =>
        if ++@a == 3
          done()

    Then -> expect(@hit).toBe 9
