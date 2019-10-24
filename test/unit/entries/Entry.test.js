'use strict'
/* global describe, it */
const assert = require('assert')
const uuid = require('uuid/v4')

describe('Entry', () => {
  it('should exist', () => {
    assert(global.app.entries)
    assert(global.app.entries.Test)
  })

  it('should create', (done) => {
    global.app.entries.Test.create({}, { name: 'test' }, {})
      .then(([_event, _options]) => {
        done()
      })
    .catch(err => {
      done(err)
    })
  })

  it('should update', (done) => {
    global.app.entries.Test.update({}, { name: 'test' }, {})
      .then(([_event, _options]) => {
        done()
      })
      .catch(err => {
        done(err)
      })
  })
})
