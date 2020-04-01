'use strict'
/* global describe, it */
const assert = require('assert')
const uuid = require('uuid/v4')

let Primus = require('primus')
  , Socket
  , client

describe('BroadcastChannel', () => {

  let Test

  it('should exist', () => {
    assert(global.app.channels)
    assert(global.app.channels.Test)
    assert(global.app.channels.Test2)
  })

  before(() => {
    Socket = Primus.createSocket({
      ...global.app.config.get('realtime.primus'),
      plugin: global.app.config.get('realtime.plugins')
    })
    client = new Socket(`http://localhost:${global.app.config.get('web.port')}`)
    // Test = client.channel('Test')
  })

  afterEach(() => {
    console.log('---------------TEST END------------------')
  })

  it('should do a test subscription', (done) => {

    let calls = 0
    client.on('data', function (msg) {
      if (msg.subscribed) {
        console.log('brk SPARK subscribed', msg)
        calls++
        if (calls === 1) {
          done()
        }
      }
    })

    client.write({
      channel: 'Test',
      subscribe: [
        'test.created',
        'test.:crud'
      ]
    })

  })

  it('should do a test connection', (done) => {

    let calls = 0
    client.on('data', function (msg) {
      console.log('brk SPARK data connection', msg)
      if (
        msg.event_type
      ) {
        calls++
        if (calls === 1) {
          done()
        }
      }
    })


    // Give the broadcaster just a little time to get loaded
    setTimeout(() => {
      global.app.entries.Test.create({}, {
        test_uuid: uuid(),
        name: 'test'
      }, {})
        .then(([_event, _options]) => {

        })
        .catch(err => {
          done(err)
        })
    }, 100)

  })

  it('should do a test unsubscribe', (done) => {

    let calls = 0

    client.on('data', function (msg) {
      if (msg.unsubscribed) {
        console.log('brk SPARK unsubscribed', msg)
        calls++
        if (calls === 1) {
          done()
        }
      }
      else {
        console.log(' BRK SPARK UNHANDLED', msg)
      }
    })

    client.write({
      channel: 'Test',
      unsubscribe: [
        'test.created',
        'test.:crud'
      ]
    })

  })

  after((done) => {
    client.end()
    done()
  })
})
