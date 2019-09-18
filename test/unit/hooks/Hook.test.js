'use strict'
/* global describe, it */
const assert = require('assert')
const uuid = require('uuid/v4')

describe('Hook', () => {
  it('should exist', () => {
    assert(global.app.hooks)
    assert(global.app.hooks.Test)
  })
})
