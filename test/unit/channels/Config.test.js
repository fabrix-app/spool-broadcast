'use strict'
/* global describe, it */
const assert = require('assert')
const uuid = require('uuid/v4')

describe('BroadcastChannel Config', () => {

  afterEach(() => {
    console.log('---------------TEST END------------------')
  })

  it('should exist', () => {
    assert(global.app.broadcasts.Test)
    assert(global.app.channels)
    assert(global.app.channels.Test)
    assert(global.app.channels.Test2)
    assert(global.app.spools.broadcast.channelMap.get('Test'))
    console.log('BRK app', global.app.spools.broadcast.channelMap.get('Test'))
    assert(global.app.spools.broadcast.channelMap.get('Test').get('Test').get('test.created'))
    assert(global.app.spools.broadcast.channelMap.get('Test').get('Test').get('test.:crud'))
  })
})
