'use strict'
/* global describe, it */
const assert = require('assert')
const uuid = require('uuid/v4')

describe('Projector', () => {
  it('should exist', () => {
    assert(global.app.projectors)
    assert(global.app.projectors.Test)
    assert(global.app.projectors.TestMulti)
  })
})
