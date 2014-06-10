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
