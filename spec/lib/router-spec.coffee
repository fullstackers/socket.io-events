EventEmitter = require('events').EventEmitter

describe 'Router', ->

  Given -> @Router = requireSubject 'lib/router', {}

  describe '#', ->
    Then -> expect(@Router() instanceof @Router).toBe true
  
  describe 'prototype', ->

    Given -> @router = @Router()

    Given -> @socket = new EventEmitter
    Given -> @socket.ack = (id) -> return ->
    
    describe '#middleware', ->

      Given -> @cb = jasmine.createSpy 'cb'
      When -> @router.middleware @socket, @cb
      Then -> expect(@socket.onevent).toEqual @router.onEvent
      And -> expect(@cb).toHaveBeenCalled()

    describe '#onEvent', ->

      Given -> spyOn(@router,['onRoute'])
      Given -> spyOn(EventEmitter.prototype.emit,['apply']).andCallThrough()
      Given -> @fn = ->
      Given -> spyOn(@socket,['ack']).andReturn(@fn)
      Given -> @packet = id:1, data: ['message', 'hello']
      When -> @router.onEvent.call @socket, @packet
      Then -> expect(@socket.ack).toHaveBeenCalledWith @packet.id
      And -> expect(@router.onRoute).toHaveBeenCalledWith @socket, ['message', 'hello', @fn]

    describe '#onRoute', ->

      Given -> @a = jasmine.createSpy 'a'
      Given -> @b = jasmine.createSpy 'b'
      Given -> @c = jasmine.createSpy 'c'
      Given -> @foo = (socket, args, next) => @a(); next()
      Given -> @bar = (socket, args, next) => @b(); next()
      Given -> @baz = (socket, args, next) => @c(); next()
      Given -> @path = [@foo, @bar, @baz]
      Given -> spyOn(@router,['getPath']).andReturn(@path)
      Given -> spyOn(@router,['decorate']).andCallThrough()
      Given -> @args = ['message', 'hello', @fn]
      When -> @router.onRoute @socket, @args
      Then -> expect(@router.getPath).toHaveBeenCalledWith @args
      And -> expect(@router.decorate).toHaveBeenCalledWith @socket, jasmine.any(Function)
      And -> expect(@a).toHaveBeenCalled()
      And -> expect(@b).toHaveBeenCalled()
      And -> expect(@c).toHaveBeenCalled()

    describe '#decorate', ->

      Given ->
        @old = emit: @socket.emit
        console.log 'socket.emit', @old
      Given -> spyOn(@old.emit, ['apply']).andCallThrough()
      Given -> @done = (emit, args) => emit.apply(@socket, args)
      When ->
        @router.decorate @socket, @done
        @socket.emit 'hello'
      Then -> expect(@old.emit.apply).toHaveBeenCalledWith @socket, ['hello']

