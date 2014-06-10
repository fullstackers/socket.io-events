describe 'Router', ->

  Given -> @Router = requireSubject 'lib/router', {}

  describe '#', ->
    Then -> expect(@Router() instanceof @Router).toBe true


