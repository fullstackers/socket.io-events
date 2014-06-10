describe 'Router', ->

  Given -> @Router = requireSubject 'lib/router', {}

  describe '#', ->
    Then -> expect(@Router() instanceof @Router).toBe true
  
  describe 'prototype', ->

    Given -> @router = @Router()
    
    describe '#middleware', ->

      Given -> @socket = new EventEmitter
      Given -> @cb = jasmine.createSpyk 'cb'
      When -> @router.middleware @socket, @cb
      Then -> expect(@socket.onevent).toEqual @router.onRoute
      And -> expect(@cb).toHaveBeenCalled()
