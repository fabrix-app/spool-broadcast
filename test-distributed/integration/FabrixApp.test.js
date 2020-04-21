'use strict'

const assert = require('assert')

describe('Fabrix App', () => {
  it('should boot', () => {
    assert(global.app)
    // assert(global.app.started)
    // assert(!global.app.stopped)
  })
})
