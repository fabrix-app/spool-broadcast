'use strict'
/* global describe, it */
const assert = require('assert')
const uuid = require('uuid/v4')


describe('Broadcast', () => {
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
