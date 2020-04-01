'use strict'
/* global describe, it */
const assert = require('assert')
const uuid = require('uuid/v4')

describe('Saga', () => {
  afterEach(() => {
    console.log('---------------TEST END------------------')
  })

  it('should exist', () => {
    assert(global.app.sagas)
    assert(global.app.sagas.Test)
  })
})
