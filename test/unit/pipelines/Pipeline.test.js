'use strict'
/* global describe, it */
const assert = require('assert')
const uuid = require('uuid/v4')

describe('pipeline', () => {
  it('should exist', () => {
    assert(global.app.pipelines)
    assert(global.app.pipelines.TestPipeline)
  })
})
