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
      And -> expect(@router.onRoute).toHaveBeenCalledWith null, jasmine.any(Object), ['message', 'hello', @fn]
      #And -> expect(@router.onRoute.mostRecentCall.args[1].sock).toBe @socket

    describe '#onRoute (err:Error=null, sock:Object, args:Array)', ->

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
      When -> @router.onRoute null, @socket, @args, null
      Then -> expect(@router.getPath).toHaveBeenCalledWith @args[0]
      And -> expect(@router.decorate).toHaveBeenCalledWith @socket, jasmine.any(Function)
      And -> expect(@a).toHaveBeenCalled()
      And -> expect(@b).toHaveBeenCalled()
      And -> expect(@c).toHaveBeenCalled()
      And -> expect(@d).not.toHaveBeenCalled()
      And -> expect(@e).toHaveBeenCalledWith @error
      And -> expect(@f).toHaveBeenCalled()
      And -> expect(@order).toEqual ['a', 'b', 'c', 'e', 'f']

    describe '#onRoute (err:Error=null, sock:Object, args:Array, cb:Function)', ->

      Given -> @order = []
      Given -> @cb = jasmine.createSpy 'cb'
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
      When -> @router.onRoute null, @socket, @args, @cb
      Then -> expect(@router.getPath).toHaveBeenCalledWith @args[0]
      And -> expect(@router.decorate).toHaveBeenCalledWith @socket, jasmine.any(Function)
      And -> expect(@a).toHaveBeenCalled()
      And -> expect(@b).toHaveBeenCalled()
      And -> expect(@c).toHaveBeenCalled()
      And -> expect(@d).not.toHaveBeenCalled()
      And -> expect(@e).toHaveBeenCalledWith @error
      And -> expect(@f).toHaveBeenCalled()
      And -> expect(@cb).toHaveBeenCalled()
      And -> expect(@order).toEqual ['a', 'b', 'c', 'e', 'f']

    describe '#onRoute (err:Error, sock:Object, args:Array)', ->

      Given -> @order = []
      Given -> @cb = jasmine.createSpy 'cb'
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
      When -> @router.onRoute @error, @socket, @args, @cb
      Then -> expect(@router.getPath).toHaveBeenCalledWith @args[0]
      And -> expect(@router.decorate).toHaveBeenCalledWith @socket, jasmine.any(Function)
      And -> expect(@a).not.toHaveBeenCalled()
      And -> expect(@b).not.toHaveBeenCalled()
      And -> expect(@c).not.toHaveBeenCalled()
      And -> expect(@d).toHaveBeenCalled()
      And -> expect(@e).toHaveBeenCalledWith @error
      And -> expect(@f).toHaveBeenCalled()
      And -> expect(@cb).toHaveBeenCalled()
      And -> expect(@order).toEqual ['d', 'e', 'f']

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

      Given -> @test = => @router.use 'some event'
      Then -> expect(@test).toThrow new Error 'we have the name, but need a handler'

    describe '#use (regexp:RegExp)', ->

      Given -> @test = => @router.use /^w+/
      Then -> expect(@test).toThrow new Error 'we have the name, but need a handler'

    describe '#use (fn:Function)', ->

      Given -> @fn = (socket, args, next) ->
      When -> @router.use @fn
      Then -> expect(@router.fns().length).toBe 1

    describe '#use (router:Router)', ->

      Given -> @a = @Router()
      When -> @router.use @a
      Then -> expect(@router.fns().length).toBe 1
      And -> expect(@router.fns()[0][1]).toEqual @a

    describe '#use (name:String,fn:Function)', ->

      Given -> @name = 'name'
      Given -> @fn = (socket, args, next) ->
      When -> @router.use @name, @fn
      Then -> expect(@router.fns(@name).length).toBe 1

    describe '#use (regexp:RegExp,fn:Function)', ->

      Given -> @name = /\w+/
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

    describe '#on', ->

      Then -> expect(@router.on).toEqual @router.use

    describe '#getPath (name:String)', ->

      Given -> @a = jasmine.createSpy 'a'
      Given -> @b = jasmine.createSpy 'b'
      Given -> @c = jasmine.createSpy 'c'
      Given -> @d = jasmine.createSpy 'd'
      Given -> @router.use 'test*', @a
      Given -> @router.use 'tes*', @b
      Given -> @router.use 't*r', @c
      Given -> @router.use /^\w+/, @d

      describe 'name matches', ->

        Given -> @name = 'tester'
        When -> @res = @router.getPath @name
        Then -> expect(@res).toEqual [@a, @b, @c, @d]

      describe 'name does not matches', ->

        Given -> @name = '!sleeper'
        When -> @res = @router.getPath @name
        Then -> expect(@res).toEqual []

    describe '#index', ->

      When -> expect(@router.index()).toBe 0
      When -> expect(@router.index()).toBe 1
      When -> expect(@router.index()).toBe 2

    describe '#fns', ->

      When -> @res = @router.fns()
      Then -> expect(@res).toEqual []

    describe '#fns (name:String="test")', ->

      Given -> @name = 'test'
      When -> @res = @router.fns @name
      Then -> expect(@res).toEqual []

    describe '#_fns', ->

      When -> @res = @router._fns()
      Then -> expect(@res).toEqual {}
