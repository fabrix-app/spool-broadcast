'use strict'
/* global describe, it */
const assert = require('assert')
const uuid = require('uuid/v4')

describe('BroadcastProcessor', () => {
  it('should exist', () => {
    assert(global.app.processors)
    assert(global.app.processors.Test)
  })
})
