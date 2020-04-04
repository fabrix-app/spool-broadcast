'use strict'
/* global describe, it */
const assert = require('assert')
const uuid = require('uuid/v4')


describe('Broadcast', () => {

  afterEach(() => {
    console.log('---------------TEST END------------------')
  })

  it('should exist', () => {
    assert(global.app.broadcaster)
    assert(global.app.broadcasts)
    assert(global.app.broadcasts.Test)
  })

  it('should create and update and have changes', (done) => {
    global.app.entries.Test.create({}, {name: 'test'}, {})
      .then(([_event, _options]) => {

        console.log('brk event changes 1', _event.changes())

        assert.ok(_event.changes('name'))
        assert.ok(_event.changes().length)

        return global.app.entries.Test.update({}, {
          test_uuid: _event.data.test_uuid,
          name: 'updated'
        }, {})

      })
      .then(([_event, _options]) => {

        console.log('brk event changes', _event.changes())

        assert.ok(_event.changes('name'))
        assert.ok(_event.changes().length)
        done()
      })
      .catch(err => {
        done(err)
      })
  })


  it('should create and update and have changes (boolean edge case)', (done) => {
    global.app.entries.Test.create({}, { name: 'string', boolean: false }, {})
      .then(([_event, _options]) => {

        console.log('brk event changes 1', _event.changes())

        assert.ok(_event.changes('boolean'))
        assert.ok(_event.changes().length)

        return global.app.entries.Test.update({}, {
          test_uuid: _event.data.test_uuid,
          boolean: true
        }, {})

      })
      .then(([_event, _options]) => {

        console.log('brk event changes', _event.changes())

        assert.ok(_event.changes('boolean'))
        assert.ok(_event.changes().length)
        done()
      })
      .catch(err => {
        done(err)
      })
  })

  it('should create and update and have changes (number edge case)', (done) => {
    global.app.entries.Test.create({}, { name: 'string', boolean: false, number: 0 }, {})
      .then(([_event, _options]) => {

        console.log('brk event changes 1', _event.changes())

        assert.ok(_event.changes('number'))
        assert.ok(_event.changes().length)

        return global.app.entries.Test.update({}, {
          test_uuid: _event.data.test_uuid,
          boolean: true,
          number: 1
        }, {})

      })
      .then(([_event, _options]) => {

        console.log('brk event changes', _event.changes())

        assert.ok(_event.changes('number'))
        assert.ok(_event.changes().length)
        done()
      })
      .catch(err => {
        done(err)
      })
  })

  it('should create and update and have changes (array edge case)', (done) => {
    global.app.entries.Test.create({}, { name: 'string', boolean: false, array: ['hello'] }, {})
      .then(([_event, _options]) => {

        console.log('brk event changes 1', _event.changes())

        assert.ok(_event.changes('array'))
        assert.ok(_event.changes().length)

        return global.app.entries.Test.update({}, {
          test_uuid: _event.data.test_uuid,
          boolean: true,
          array: ['world']
        }, {})

      })
      .then(([_event, _options]) => {

        console.log('brk event changes', _event.changes())

        assert.ok(_event.changes('array'))
        assert.ok(_event.changes().length)
        done()
      })
      .catch(err => {
        done(err)
      })
  })

  it('should create and update and have changes (json edge case)', (done) => {
    global.app.entries.Test.create({}, { name: 'string', boolean: false, array: ['hello'], json: {'hello': 'world'} }, {})
      .then(([_event, _options]) => {

        console.log('brk event changes 1', _event.changes())

        assert.ok(_event.changes('json'))
        assert.ok(_event.changes().length)

        return global.app.entries.Test.update({}, {
          test_uuid: _event.data.test_uuid,
          boolean: true,
          array: ['world'],
          json: {'hello': 'mars'}
        }, {})

      })
      .then(([_event, _options]) => {

        console.log('brk event changes', _event.changes())

        assert.ok(_event.changes('json'))
        assert.ok(_event.changes().length)
        done()
      })
      .catch(err => {
        done(err)
      })
  })

  it('should build a projection of an event', (done) => {
    global.app.entries.Test.create({}, {name: 'test'}, {})
      .then(([_event, _options]) => {

        const event = global.app.broadcasts.Test.buildProjection({event: _event, options: _options})

        console.log('BRK build projection', event)

        assert.equal(event.is_projection, true)

        done()
      })
      .catch(err => {
        done(err)
      })
  })
})
