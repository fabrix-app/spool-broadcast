'use strict'
/* global describe, it */
const assert = require('assert')
const uuid = require('uuid/v4')

describe('Saga', () => {
  it('should exist', () => {
    assert(global.app.sagas)
    assert(global.app.sagas.Test)
  })
})
