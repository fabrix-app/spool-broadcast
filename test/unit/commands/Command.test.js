'use strict'
/* global describe, it */
const assert = require('assert')
const uuid = require('uuid/v4')

describe('Entry', () => {
  let test_uuid, testCommand1, testCommand2

  it('should have broadcasters in test', () => {
    assert(global.app.broadcaster)
    assert(global.app.broadcasts)
    assert(global.app.broadcasts.TestBroadcast2)
  })


  it('should test command on new object', (done) => {

    const req = {}

    let body = {
      string: 'test',
      number: 0,
      keyvalue: { hello: 'world' },
      array: ['hello', 'world'],
      child: {
        name: 'test'
      },
      children: [{
        name: 'test'
      }]
    }

    const TestBroadcast = global.app.broadcasts.TestBroadcast2

    // Build a permission instance
    body = global.app.models.TestChange.stage(body, {
      isNewRecord: true,
      configure: ['generateUUID'],
      stage: [
        {
          model: global.app.models.Test,
          as: 'child',
          options: {
            isNewRecord: true,
            configure: ['generateUUID'],
          }
        },
        {
          model: global.app.models.Test,
          as: 'children',
          options: {
            isNewRecord: true,
            configure: ['generateUUID'],
          }
        }
      ]
    })

    testCommand1 = TestBroadcast.createCommand({
      req: req,
      command_type: 'create.change',
      object: global.app.models.TestChange,
      data: body,
      causation_uuid: req.causation_uuid,
      correlation_uuid: req.correlation_uuid,
      metadata: {}
    })

    console.log('BRK command before', testCommand1)


    testCommand1.reload({})
      .then(() => {
        console.log('BRK command after reload', testCommand1)

        testCommand1.restage()

        console.log('BRK command after restage', testCommand1)

        done()
      })
      .catch(err => {
        done(err)
      })
  })
})
