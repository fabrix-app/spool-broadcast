'use strict'
/* global describe, it */
const assert = require('assert')
const uuid = require('uuid/v4')

describe('Entry', () => {
  let test_uuid

  it('should exist', () => {
    assert(global.app.entries)
    assert(global.app.entries.Test)
  })

  it('should create', (done) => {
    global.app.entries.Test.create({}, { name: 'test' }, {})
      .then(([_event, _options]) => {
        test_uuid = _event.data.test_uuid

        done()
      })
    .catch(err => {
      done(err)
    })
  })

  it('should bulk create', (done) => {
    global.app.entries.Test.bulkCreate({}, [{ name: 'test' }], {})
      .then(([_event, _options]) => {
        done()
      })
      .catch(err => {
        done(err)
      })
  })

  it('should update', (done) => {
    global.app.entries.Test.update({}, {
      test_uuid: test_uuid,
      name: 'test 2'
    }, {})
      .then(([_event, _options]) => {
        done()
      })
      .catch(err => {
        done(err)
      })
  })

  it('should create with params', (done) => {
    global.app.entries.Test.createWithParams({}, {
      test_uuid: uuid(),
      name: 'test'
    }, {})
      .then(([_event, _options]) => {
        done()
      })
      .catch(err => {
        done(err)
      })
  })

  it('should create with double params', (done) => {
    global.app.entries.Test.createWithDoubleParams({}, {
      test_uuid: uuid(),
      name: 'test'
    }, {})
      .then(([_event, _options]) => {
        done()
      })
      .catch(err => {
        done(err)
      })
  })
})
