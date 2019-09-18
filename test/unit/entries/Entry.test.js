'use strict'
/* global describe, it */
const assert = require('assert')
const uuid = require('uuid/v4')

describe('Entry', () => {
  it('should exist', () => {
    assert(global.app.entries)
    assert(global.app.entries.Test)
  })
})
