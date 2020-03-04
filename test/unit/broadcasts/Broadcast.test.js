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

  it('should create on a single broadcaster', (done) => {
    global.app.entries.Test.create({}, {name: 'test'}, {})
      .then(([_event, _options]) => {

        console.log('brk trace', global.app.broadcasts.Test.unnestTrace(_options))
        console.log('brk trace flat', global.app.broadcasts.Test.flattenTrace(_options))

        console.log('BRK event', _event)

        done()
      })
      .catch(err => {
        done(err)
      })
  })

  it('should create on a separate broadcaster and cross to the first broadcaster', (done) => {
    global.app.entries.TestEntry2.create({}, {name: 'test'}, {})
      .then(([_event, _options]) => {

        console.log('brk trace', global.app.broadcasts.Test.unnestTrace(_options))
        console.log('brk trace flat', global.app.broadcasts.Test.flattenTrace(_options))

        console.log('BRK event', _event)

        done()
      })
      .catch(err => {
        done(err)
      })
  })
})
