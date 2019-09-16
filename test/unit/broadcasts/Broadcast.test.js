'use strict'
/* global describe, it */
const assert = require('assert')
const uuid = require('uuid/v4')

describe('Broadcast', () => {
  it('should exist', () => {
    assert(global.app.broadcaster)
    assert(global.app.broadcasts)
  })
})
