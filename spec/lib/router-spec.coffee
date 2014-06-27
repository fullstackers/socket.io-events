EventEmitter = require('events').EventEmitter

describe 'Router', ->

  Given -> @Router = requireSubject 'lib/router', {}

  describe '#', ->
    Given -> @res = @Router()
    Given -> spyOn(@res,'middleware')
    When -> @res()
    Then -> expect(@res instanceof @Router).toBe true
    And -> expect(@res.middleware).toHaveBeenCalled()
  
  describe 'prototype', ->

    Given -> @router = @Router()

    Given -> @socket = new EventEmitter
    Given -> @socket.ack = (id) -> return ->
    
    describe '#middleware', ->

      Given -> @cb = jasmine.createSpy 'cb'
      Given -> @router.middleware @socket, @cb
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
      And -> expect(@router.onRoute).toHaveBeenCalledWith null, @socket, ['message', 'hello', @fn]

    describe '#onRoute', ->

      Given -> @order = []
      Given -> @a = jasmine.createSpy 'a'
      Given -> @b = jasmine.createSpy 'b'
      Given -> @c = jasmine.createSpy 'c'
      Given -> @d = jasmine.createSpy 'd'
      Given -> @e = jasmine.createSpy 'e'
      Given -> @f = jasmine.createSpy 'f'
      Given -> @error = new Error 'something wrong'
      Given -> @foo = (socket, args, next) => @a(); @order.push('a'); next()
      Given -> @bar = (socket, args, next) => @b(); @order.push('b'); next()
      Given -> @baz = (socket, args, next) => @c(); @order.push('c'); next @error 
      Given -> @err = (err, socket, args, next) => @d err; @order.push('d'); next err
      Given -> @err1 = (err, socket, args, next) => @e err; @order.push('e'); next()
      Given -> @cra = (socket, args, next) => @f(); @order.push('f'); next()
      Given -> @path = [@foo, @bar, @err, @baz, @err1, @cra]
      Given -> @router.use @path
      Given -> spyOn(@router,['getPath']).andCallThrough()
      Given -> spyOn(@router,['decorate']).andCallThrough()
      Given -> @args = ['message', 'hello', @fn]
      When -> @router.onRoute null, @socket, @args
      Then -> expect(@router.getPath).toHaveBeenCalledWith @args[0]
      And -> expect(@router.decorate).toHaveBeenCalledWith @socket, jasmine.any(Function)
      And -> expect(@a).toHaveBeenCalled()
      And -> expect(@b).toHaveBeenCalled()
      And -> expect(@c).toHaveBeenCalled()
      And -> expect(@d).not.toHaveBeenCalled()
      And -> expect(@e).toHaveBeenCalledWith @error
      And -> expect(@f).toHaveBeenCalled()
      And -> expect(@order).toEqual ['a', 'b', 'c', 'e', 'f']

    describe '#decorate', ->

      Given -> @old = emit: @socket.emit
      Given -> spyOn(@old.emit, ['apply']).andCallThrough()
      Given -> @done = (emit, args) => emit.apply(@socket, args)
      When ->
        @router.decorate @socket, @done
        @socket.emit 'hello'
      Then -> expect(@old.emit.apply).toHaveBeenCalledWith @socket, ['hello']

    describe '#use', ->

      Given -> @test = => @router.use()
      Then -> expect(@test).toThrow new Error 'expecting at least one parameter'

    describe '#use (name:Sring)', ->

      Given -> @test = => @router.use 'name'
      Then -> expect(@test).toThrow new Error 'we have the name, but need a handler'

    describe '#use (fn:Function)', ->

      Given -> @fn = (socket, args, next) ->
      When -> @router.use @fn
      Then -> expect(@router.fns().length).toBe 1

    describe '#use (name:String,fn:Function)', ->

      Given -> @name = 'name'
      Given -> @fn = (socket, args, next) ->
      When -> @router.use @name, @fn
      Then -> expect(@router.fns(@name).length).toBe 1

    describe '#use (name:Array)', ->

      Given -> @a = ->
      Given -> @b = ->
      Given -> @c = ->
      Given -> @name = [@a, @b, @c]
      When -> @router.use @name
      Then -> expect(@router.fns()).toEqual [[0,@a], [1,@b], [2,@c]]

    describe '#getPath (name:String)', ->

      Given -> @a = ->
      Given -> @b = ->
      Given -> @c = ->
      Given -> @router.use @a
      Given -> @router.use 'event', @b
      Given -> @router.use '*', @c
      When -> @path = @router.getPath ['event']
      Then -> expect(@path).toEqual [@a, @b, @c]

   describe '#index', ->

     When -> expect(@router.index()).toBe 0
     When -> expect(@router.index()).toBe 1
     When -> expect(@router.index()).toBe 2
