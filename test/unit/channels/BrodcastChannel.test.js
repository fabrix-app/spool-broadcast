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
  })

  before(() => {
    Socket = Primus.createSocket({
      ...global.app.config.get('realtime.primus'),
      plugin: global.app.config.get('realtime.plugins')
    })
    client = new Socket(`http://localhost:${global.app.config.get('web.port')}`)
    Test = client.channel('Test')
  })

  it('should do a test subscription', (done) => {

    Test.on('data', function (msg) {
      if (msg.subscribed) {
        console.log('brk SPARK subscribed', msg)
        done()
      }
    })

    Test.write({
      subscribe: [
        'test.created',
        'test.:crud'
      ]
    })

  })
  it('should do a test connection', (done) => {

    Test.on('data', function (msg) {
      console.log('brk SPARK data connection', msg)
      if (msg.event_type) {
        done()
      }
    })


    global.app.entries.Test.createWithParams({}, {
      test_uuid: uuid(),
      name: 'test'
    }, {})
      .then(([_event, _options]) => {

      })
      .catch(err => {
        done(err)
      })

  })

  it('should do a test unsubscribe', (done) => {

    Test.on('data', function (msg) {
      if (msg.unsubscribed) {
        console.log('brk SPARK unsubscribed', msg)
        done()
      }
      else {
        console.log(' BRK SPARK UNHANDLED', msg)
      }
    })

    Test.write({
      unsubscribe: [
        'test.created',
        'test.:crud'
      ]
    })

  })

  after((done) => {
    Test.end()
    done()
  })
})
