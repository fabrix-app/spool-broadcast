'use strict'
/* global describe, it */
const assert = require('assert')
const uuid = require('uuid/v4')

let Primus = require('primus')
  , Socket
  , client

describe('BroadcastChannel', () => {
  it('should exist', () => {
    assert(global.app.channels)
    assert(global.app.channels.Test)
  })

  before(() => {
    Socket = Primus.createSocket({
      ...global.app.config.get('realtime.primus'),
      plugin: global.app.config.get('realtime.plugins')
    })
    client = new Socket(`http://localhost:${global.app.config.get('web.port')}`)
  })

  it('should do a test connection', (done) => {
    console.log('brk primus 2', client)

    const Test = client.channel('Test')

    Test.on('data', function (msg) {
      console.log('brk primus 4', msg)
    })

    setTimeout(function () {
      done()
    }, 100)
  })
})
