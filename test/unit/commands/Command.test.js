'use strict'
/* global describe, it */
const assert = require('assert')
const uuid = require('uuid/v4')
const Validator = require('../../../dist/validator').Validator
const joi = require('@hapi/joi')

describe('Command', () => {
  let test_uuid, testCommand1, testCommand2, testCommand3, testCommand4, testCommand5

  it('should have broadcasters in test', () => {
    assert(global.app.broadcaster)
    assert(global.app.broadcasts)
    assert(global.app.broadcasts.TestBroadcast2)
  })

  afterEach(() => {
    console.log('---------------TEST END------------------')
  })


  it('should test command on new object', (done) => {

    const TestBroadcast = global.app.broadcasts.TestBroadcast2
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

    testCommand1.hooks = [{ prehook_url: 'example.com' }]

    console.log('*********************************')
    console.log('BRK command create before reload')
    console.log('data', testCommand1.data)
    console.log('updates', testCommand1.data_updates)
    console.log('previous', testCommand1.data_previous)
    console.log('applied', testCommand1.data_applied)
    console.log('changed', testCommand1.data_changed)
    console.log('*********************************')

    assert.deepEqual(testCommand1.hooks, [{ prehook_url: 'example.com' }])
    assert.deepEqual(testCommand1.metadata.hooks, testCommand1.hooks)

    assert.equal(testCommand1.data.string, 'test')
    assert.equal(testCommand1.data.string, testCommand1.data_updates.string)
    assert.equal(testCommand1.data.number, 0)
    assert.equal(testCommand1.data.number, testCommand1.data_updates.number)
    assert.deepEqual(testCommand1.data.keyvalue, {hello: 'world'})
    assert.deepEqual(testCommand1.data.keyvalue, testCommand1.data_updates.keyvalue)
    assert.deepEqual(testCommand1.data.array, ['hello', 'world'])
    assert.deepEqual(testCommand1.data.array, testCommand1.data_updates.array)
    assert.ok(testCommand1.data.child)
    assert.ok(testCommand1.data.children)

    assert.deepEqual(testCommand1.data_previous, {})
    assert.deepEqual(testCommand1.data_applied, {})
    assert.deepEqual(testCommand1.data_changed, {})

    // console.log('BRK UNAPPLIED', testCommand1.unapplied())
    // console.log('BRK UPDATED', testCommand1.updated())


    testCommand1.reload({})
      .then(() => {

        console.log('*********************************')
        console.log('BRK command create after reload')
        console.log('data', testCommand1.data)
        console.log('updates', testCommand1.data_updates)
        console.log('previous', testCommand1.data_previous)
        console.log('applied', testCommand1.data_applied)
        console.log('changed', testCommand1.data_changed)
        console.log('*********************************')

        assert.equal(testCommand1.data.string, 'test')
        assert.equal(testCommand1.data.string, testCommand1.data_applied.string)
        assert.equal(testCommand1.data.string, testCommand1.data_updates.string)
        assert.equal(testCommand1.data_previous.string, null)
        assert.equal(testCommand1.data_changed.string, null)

        assert.equal(testCommand1.data.number, 0)
        assert.equal(testCommand1.data.number, testCommand1.data_applied.number)
        assert.equal(testCommand1.data.number, testCommand1.data_updates.number)
        assert.equal(testCommand1.data_previous.number, null)
        assert.equal(testCommand1.data_changed.number, null)

        assert.deepEqual(testCommand1.data.keyvalue, {hello: 'world'})
        assert.deepEqual(testCommand1.data.keyvalue, testCommand1.data_applied.keyvalue)
        assert.deepEqual(testCommand1.data.keyvalue, testCommand1.data_updates.keyvalue)
        assert.equal(testCommand1.data_previous.keyvalue, null)
        assert.equal(testCommand1.data_changed.keyvalue, null)

        assert.deepEqual(testCommand1.data.array, ['hello', 'world'])
        assert.deepEqual(testCommand1.data.array, testCommand1.data_applied.array)
        assert.deepEqual(testCommand1.data.array, testCommand1.data_updates.array)
        assert.equal(testCommand1.data_previous.array, null)
        assert.equal(testCommand1.data_changed.array, null)

        assert.ok(testCommand1.data.child)
        assert.ok(testCommand1.data.children)

        testCommand1.apply('string', 'test1')
        assert.equal(testCommand1.data.string, 'test1')
        assert.equal(testCommand1.data.string, testCommand1.data_applied.string)
        assert.equal(testCommand1.data_changed.string, null)
        assert.equal(testCommand1.data_previous.string, null)
        testCommand1.approveChange('string')

        // console.log('BRK UNAPPLIED', testCommand1.unapplied())
        // console.log('BRK UPDATED', testCommand1.updated())

        testCommand1.apply('number', 1)
        assert.equal(testCommand1.data.number, 1)
        assert.equal(testCommand1.data.number, testCommand1.data_applied.number)
        assert.equal(testCommand1.data.number, testCommand1.data_updates.number)
        assert.equal(testCommand1.data_changed.number, null)
        assert.equal(testCommand1.data_previous.number, null)

        testCommand1.apply('keyvalue', {hello: 'earth'})
        assert.deepEqual(testCommand1.data.keyvalue, {hello: 'earth'})
        assert.deepEqual(testCommand1.data.keyvalue, testCommand1.data_applied.keyvalue)
        assert.deepEqual(testCommand1.data.keyvalue, testCommand1.data_updates.keyvalue)
        assert.deepEqual(testCommand1.data_changed.keyvalue, null)
        assert.deepEqual(testCommand1.data_previous.keyvalue, null)

        testCommand1.apply('array', ['hello', 'earth'])
        assert.deepEqual(testCommand1.data.array, ['hello', 'earth'])
        assert.deepEqual(testCommand1.data.array, testCommand1.data_applied.array)
        assert.deepEqual(testCommand1.data.array, testCommand1.data_updates.array)
        assert.deepEqual(testCommand1.data_changed.array, null)
        assert.deepEqual(testCommand1.data_previous.array, null)

        console.log('BRK command changes', testCommand1.changes())
        assert.equal(testCommand1.changes('test_uuid'), 'test_uuid')
        assert.equal(testCommand1.changes('array'), 'array')
        assert.deepEqual(testCommand1.changes(), ['test_uuid', 'string', 'number', 'keyvalue', 'array'])
        assert.deepEqual(testCommand1.metadata.changes, ['test_uuid', 'string', 'number', 'keyvalue', 'array'])

        return testCommand1.data.save()
      })
      .then(() => {

        // testCommand1.restage()
        //
        // console.log('BRK command after restage', testCommand1)

        done()
      })
      .catch(err => {
        done(err)
      })
  })

  it('should test command on update object', (done) => {

    const TestBroadcast = global.app.broadcasts.TestBroadcast2
    const req = {}

    let body = {
      ...JSON.parse(JSON.stringify(testCommand1.data)),
      string: 'test2',
      number: 2,
      keyvalue: {hello: 'mars'},
      array: ['hello', 'mars']
    }

    // Build a permission instance
    body = global.app.models.TestChange.stage(body, {
      isNewRecord: false,
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


    assert.equal(testCommand1.data.string, 'test2')
    assert.equal(testCommand1.data.string, testCommand1.data_updates.string)

    assert.equal(testCommand1.data.number, 2)
    assert.equal(testCommand1.data.number, testCommand1.data_updates.number)

    assert.deepEqual(testCommand1.data.keyvalue, {hello: 'mars'})
    assert.deepEqual(testCommand1.data.keyvalue, testCommand1.data_updates.keyvalue)

    assert.deepEqual(testCommand1.data_previous, {})
    assert.deepEqual(testCommand1.data_applied, {})
    assert.deepEqual(testCommand1.data_changed, {})


    assert.ok(testCommand1.data.child)
    assert.ok(testCommand1.data.children)


    console.log('*********************************')
    console.log('BRK command update before reload')
    console.log('data', testCommand1.data)
    console.log('updates', testCommand1.data_updates)
    console.log('previous', testCommand1.data_previous)
    console.log('applied', testCommand1.data_applied)
    console.log('changed', testCommand1.data_changed)
    console.log('*********************************')


    testCommand1.reload({})
      .then(() => {
        console.log('*********************************')
        console.log('BRK command update after reload')
        console.log('data', testCommand1.data)
        console.log('updates', testCommand1.data_updates)
        console.log('previous', testCommand1.data_previous)
        console.log('applied', testCommand1.data_applied)
        console.log('changed', testCommand1.data_changed)
        console.log('*********************************')

        assert.equal(testCommand1.data.string, 'test1')
        assert.equal(testCommand1.data_updates.string, 'test2')
        assert.equal(testCommand1.data_previous.string, 'test1')

        assert.equal(testCommand1.data.number, 1)
        assert.equal(testCommand1.data_updates.number, 2)
        assert.equal(testCommand1.data_previous.number, 1)

        assert.deepEqual(testCommand1.data.keyvalue, {hello: 'earth'})
        assert.deepEqual(testCommand1.data_previous.keyvalue, {hello: 'earth'})
        assert.deepEqual(testCommand1.data_updates.keyvalue, {hello: 'mars'})

        testCommand1.approveUpdates([ 'string', 'number', 'keyvalue', 'array' ])

        assert.equal(testCommand1.data.string, 'test2')
        assert.equal(testCommand1.data_updates.string, 'test2')
        assert.equal(testCommand1.data_applied.string, 'test2')
        assert.equal(testCommand1.data_previous.string, 'test1')
        assert.equal(testCommand1.data_changed.string, 'test1')

        assert.equal(testCommand1.data.number, 2)
        assert.equal(testCommand1.data_updates.number, 2)
        assert.equal(testCommand1.data_applied.number, 2)
        assert.equal(testCommand1.data_previous.number, 1)
        assert.equal(testCommand1.data_changed.number, 1)

        assert.deepEqual(testCommand1.data.keyvalue, {hello: 'mars'})
        assert.deepEqual(testCommand1.data.keyvalue, testCommand1.data_updates.keyvalue)
        assert.deepEqual(testCommand1.data.keyvalue, testCommand1.data_applied.keyvalue)
        assert.deepEqual(testCommand1.data_previous.keyvalue, {hello: 'earth'})
        assert.deepEqual(testCommand1.data_changed.keyvalue, {hello: 'earth'})

        assert.deepEqual(testCommand1.data.array, ['hello', 'mars'])
        assert.deepEqual(testCommand1.data.array, testCommand1.data_applied.array)
        assert.deepEqual(testCommand1.data.array, testCommand1.data_updates.array)
        assert.deepEqual(testCommand1.data_changed.array, ['hello', 'earth'])
        assert.deepEqual(testCommand1.data_previous.array, ['hello', 'earth'])

        assert.ok(testCommand1.data.child)
        assert.ok(testCommand1.data.children)

        console.log('BRK command changes', testCommand1.changes())
        assert.deepEqual(testCommand1.changes(), ['string', 'number', 'keyvalue', 'array'])
        assert.deepEqual(testCommand1.metadata.changes, ['string', 'number', 'keyvalue', 'array'])


        return testCommand1.data.save()
      })
      .then(() => {

        testCommand1.restage()

        console.log('*********************************')
        console.log('BRK command update after restage')
        console.log('data', testCommand1.data)
        console.log('updates', testCommand1.data_updates)
        console.log('previous', testCommand1.data_previous)
        console.log('applied', testCommand1.data_applied)
        console.log('changed', testCommand1.data_changed)
        console.log('*********************************')

        done()
      })
      .catch(err => {
        done(err)
      })
  })

  it('should test command on update object that is already reloaded', (done) => {
    const TestBroadcast = global.app.broadcasts.TestBroadcast2
    const req = {}

    let body = testCommand1.data

    try {
      // Build a permission instance
      body = global.app.models.TestChange.stage(body, {
        isNewRecord: false,
        isReloaded: true,
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
    }
    catch (err) {
      done(err)
    }

    testCommand1 = TestBroadcast.createCommand({
      req: req,
      command_type: 'create.change',
      object: global.app.models.TestChange,
      data: body,
      causation_uuid: req.causation_uuid,
      correlation_uuid: req.correlation_uuid,
      metadata: {}
    })


    assert.equal(testCommand1.data.string, 'test2')
    assert.equal(testCommand1.data.string, testCommand1.data_updates.string)

    assert.equal(testCommand1.data.number, 2)
    assert.equal(testCommand1.data.number, testCommand1.data_updates.number)

    assert.deepEqual(testCommand1.data.keyvalue, {hello: 'mars'})
    assert.deepEqual(testCommand1.data.keyvalue, testCommand1.data_updates.keyvalue)

    assert.deepEqual(testCommand1.data_previous, {})
    assert.deepEqual(testCommand1.data_applied, {})
    assert.deepEqual(testCommand1.data_changed, {})


    assert.ok(testCommand1.data.child)
    assert.ok(testCommand1.data.children)


    console.log('*********************************')
    console.log('BRK command double update before reload')
    console.log('data', testCommand1.data)
    console.log('updates', testCommand1.data_updates)
    console.log('previous', testCommand1.data_previous)
    console.log('applied', testCommand1.data_applied)
    console.log('changed', testCommand1.data_changed)
    console.log('*********************************')


    testCommand1.reload({})
      .then(() => {
        console.log('*********************************')
        console.log('BRK command double update after reload')
        console.log('data', testCommand1.data)
        console.log('updates', testCommand1.data_updates)
        console.log('previous', testCommand1.data_previous)
        console.log('applied', testCommand1.data_applied)
        console.log('changed', testCommand1.data_changed)
        console.log('*********************************')

        assert.equal(testCommand1.data.string, 'test2')
        assert.equal(testCommand1.data_updates.string, 'test2')
        assert.equal(testCommand1.data_previous.string, 'test2')

        assert.equal(testCommand1.data.number, 2)
        assert.equal(testCommand1.data_updates.number, 2)
        assert.equal(testCommand1.data_previous.number, 2)

        assert.deepEqual(testCommand1.data.keyvalue, {hello: 'mars'})
        assert.deepEqual(testCommand1.data_previous.keyvalue, {hello: 'mars'})
        assert.deepEqual(testCommand1.data_updates.keyvalue, {hello: 'mars'})

        testCommand1.approveUpdates([ 'string', 'number', 'keyvalue', 'array' ])

        assert.equal(testCommand1.data.string, 'test2')
        assert.equal(testCommand1.data_updates.string, 'test2')
        assert.equal(testCommand1.data_applied.string, undefined)
        assert.equal(testCommand1.data_previous.string, 'test2')
        assert.equal(testCommand1.data_changed.string, undefined)

        assert.equal(testCommand1.data.number, 2)
        assert.equal(testCommand1.data_updates.number, 2)
        assert.equal(testCommand1.data_applied.number, undefined)
        assert.equal(testCommand1.data_previous.number, 2)
        assert.equal(testCommand1.data_changed.number, undefined)

        assert.deepEqual(testCommand1.data.keyvalue, {hello: 'mars'})
        assert.deepEqual(testCommand1.data.keyvalue, testCommand1.data_updates.keyvalue)
        assert.equal(testCommand1.data_applied.keyvalue, undefined)
        assert.deepEqual(testCommand1.data_previous.keyvalue, {hello: 'mars'})
        assert.equal(testCommand1.data_changed.keyvalue, undefined)

        assert.deepEqual(testCommand1.data.array, ['hello', 'mars'])
        assert.deepEqual(testCommand1.data.array, testCommand1.data_updates.array)
        assert.equal(testCommand1.data_applied.array, undefined)
        assert.deepEqual(testCommand1.data_previous.array, ['hello', 'mars'])
        assert.equal(testCommand1.data_changed.array, undefined)

        assert.ok(testCommand1.data.child)
        assert.ok(testCommand1.data.children)

        console.log('BRK command changes', testCommand1.changes())
        assert.deepEqual(testCommand1.changes(), [])
        assert.deepEqual(testCommand1.metadata.changes, [])


        return testCommand1.data.save()
      })
      .then(() => {

        testCommand1.restage()

        console.log('*********************************')
        console.log('BRK command double update after restage')
        console.log('data', testCommand1.data)
        console.log('updates', testCommand1.data_updates)
        console.log('previous', testCommand1.data_previous)
        console.log('applied', testCommand1.data_applied)
        console.log('changed', testCommand1.data_changed)
        console.log('*********************************')

        done()
      })
      .catch(err => {
        done(err)
      })
  })


  it('should test command on new object list', (done) => {

    const TestBroadcast = global.app.broadcasts.TestBroadcast2
    const req = {}

    let body = [{
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
    }]

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

    testCommand2 = TestBroadcast.createCommand({
      req: req,
      command_type: 'create.change',
      object: global.app.models.TestChange,
      data: body,
      causation_uuid: req.causation_uuid,
      correlation_uuid: req.correlation_uuid,
      metadata: {}
    })

    console.log('BRK command before',
      'data', testCommand2.data,
      'updates', testCommand2.data_updates,
      'previous', testCommand2.data_previous,
      'applied', testCommand2.data_applied,
      'changed', testCommand2.data_changed
    )

    assert.equal(testCommand2.data[0].string, testCommand2.data_updates[0].string)
    assert.equal(testCommand2.data[0].number, testCommand2.data_updates[0].number)
    assert.deepEqual(testCommand2.data[0].keyvalue, testCommand2.data_updates[0].keyvalue)
    assert.ok(testCommand2.data[0].child)
    assert.ok(testCommand2.data[0].children)


    testCommand2.reload({})
      .then(() => {
        console.log('BRK command after reload',
          'data', testCommand2.data,
          'updates', testCommand2.data_updates,
          'previous', testCommand2.data_previous,
          'applied', testCommand2.data_applied,
          'changed', testCommand2.data_changed
        )

        assert.equal(testCommand2.data[0].string, testCommand2.data_applied[0].string)
        assert.equal(testCommand2.data[0].string, testCommand2.data_updates[0].string)

        assert.equal(testCommand2.data[0].number, testCommand2.data_applied[0].number)
        assert.equal(testCommand2.data[0].number, testCommand2.data_updates[0].number)

        assert.ok(testCommand2.data[0].child)
        assert.ok(testCommand2.data[0].children)
        //
        testCommand2.apply('0.string', 'test1')
        assert.equal(testCommand2.data[0].string, 'test1')
        assert.equal(testCommand2.data[0].string, testCommand2.data_applied[0].string)
        assert.equal(testCommand2.data_changed[0].string, null)
        assert.equal(testCommand2.data_previous[0].string, null)

        testCommand2.apply('0.number', 1)
        assert.equal(testCommand2.data[0].number, 1)
        assert.equal(testCommand2.data[0].number, testCommand2.data_applied[0].number)
        assert.equal(testCommand2.data[0].number, testCommand2.data_updates[0].number)
        assert.equal(testCommand2.data_changed[0].number, null)
        assert.equal(testCommand2.data_previous[0].number, null)

        testCommand2.apply('0.keyvalue', {hello: 'earth'})
        assert.deepEqual(testCommand2.data[0].keyvalue, {hello: 'earth'})
        assert.deepEqual(testCommand2.data[0].keyvalue, testCommand2.data_applied[0].keyvalue)
        assert.deepEqual(testCommand2.data[0].keyvalue, testCommand2.data_updates[0].keyvalue)
        assert.deepEqual(testCommand2.data_changed[0].keyvalue, null)
        assert.deepEqual(testCommand2.data_previous[0].keyvalue, null)

        console.log('BRK command changes', testCommand2.changes())
        assert.deepEqual(testCommand2.changes(), [['test_uuid', 'string', 'number', 'keyvalue', 'array']])
        assert.deepEqual(testCommand2.metadata.changes, [['test_uuid', 'string', 'number', 'keyvalue', 'array']])

        return testCommand2.broadcastSeries(testCommand2.data, (d) => { return d.save()})
      })
      .then(() => {

        // testCommand2.restage()
        //
        // console.log('BRK command after restage', testCommand2)

        done()
      })
      .catch(err => {
        done(err)
      })
  })

  it.skip('should test command on update object list', (done) => {

    const TestBroadcast = global.app.broadcasts.TestBroadcast2
    const req = {}

    let body = JSON.parse(JSON.stringify(testCommand2.data))
      body[0].string = 'test2'
      body[0].number = 2
      body[0].keyvalue = {hello: 'mars'}

    // Build a permission instance
    body = global.app.models.TestChange.stage(body, {
      isNewRecord: false,
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

    testCommand2 = TestBroadcast.createCommand({
      req: req,
      command_type: 'create.change',
      object: global.app.models.TestChange,
      data: body,
      causation_uuid: req.causation_uuid,
      correlation_uuid: req.correlation_uuid,
      metadata: {}
    })


    assert.equal(testCommand2.data[0].string, 'test2')
    assert.equal(testCommand2.data[0].string, testCommand2.data_updates[0].string)

    assert.equal(testCommand2.data[0].number, 2)
    assert.equal(testCommand2.data[0].number, testCommand2.data_updates[0].number)

    assert.deepEqual(testCommand2.data[0].keyvalue, {hello: 'mars'})
    assert.deepEqual(testCommand2.data[0].keyvalue, testCommand2.data_updates[0].keyvalue)

    assert.ok(testCommand2.data[0].child)
    assert.ok(testCommand2.data[0].children)


    console.log('BRK command before 2',
      'data', testCommand2.data,
      'updates', testCommand2.data_updates,
      'previous', testCommand2.data_previous,
      'applied', testCommand2.data_applied,
      'changed', testCommand2.data_changed
    )


    testCommand2.reload({})
      .then(() => {
        console.log('BRK command after reload 2',
          'data', testCommand2.data,
          'updates', testCommand2.data_updates,
          'previous', testCommand2.data_previous,
          'applied', testCommand2.data_applied,
          'changed', testCommand2.data_changed
        )

        assert.equal(testCommand2.data[0].string, 'test1')
        assert.equal(testCommand2.data_updates[0].string, 'test2')
        assert.equal(testCommand2.data_previous[0].string, 'test1')

        assert.equal(testCommand2.data[0].number, 1)
        assert.equal(testCommand2.data_updates[0].number, 2)
        assert.equal(testCommand2.data_previous[0].number, 1)

        assert.deepEqual(testCommand2.data[0].keyvalue, {hello: 'earth'})
        assert.deepEqual(testCommand2.data_previous[0].keyvalue, {hello: 'earth'})
        assert.deepEqual(testCommand2.data_updates[0].keyvalue, {hello: 'mars'})

        testCommand2.approveUpdates([ '0.string', '0.number', '0.keyvalue' ])

        assert.equal(testCommand2.data[0].string, 'test2')
        assert.equal(testCommand2.data_updates[0].string, 'test2')
        assert.equal(testCommand2.data_applied[0].string, 'test2')
        assert.equal(testCommand2.data_previous[0].string, 'test1')
        assert.equal(testCommand2.data_changed[0].string, 'test1')

        assert.equal(testCommand2.data[0].number, 2)
        assert.equal(testCommand2.data_updates[0].number, 2)
        assert.equal(testCommand2.data_applied[0].number, 2)
        assert.equal(testCommand2.data_previous[0].number, 1)
        assert.equal(testCommand2.data_changed[0].number, 1)

        assert.deepEqual(testCommand2.data[0].keyvalue, {hello: 'mars'})
        assert.deepEqual(testCommand2.data[0].keyvalue, testCommand2.data_updates[0].keyvalue)
        assert.deepEqual(testCommand2.data[0].keyvalue, testCommand2.data_applied[0].keyvalue)
        assert.deepEqual(testCommand2.data_previous[0].keyvalue, {hello: 'earth'})
        assert.deepEqual(testCommand2.data_changed[0].keyvalue, {hello: 'earth'})

        assert.ok(testCommand2.data[0].child)
        assert.ok(testCommand2.data[0].children)

        console.log('BRK command changes', testCommand2.changes())
        assert.deepEqual(testCommand2.changes(), [['string', 'number', 'keyvalue']])
        assert.deepEqual(testCommand2.metadata.changes, [['string', 'number', 'keyvalue']])


        return testCommand2.broadcastSeries(testCommand2.data, (d) => { return d.save()})
      })
      .then(() => {

        testCommand2.restage()

        console.log('BRK command after restage',
          'data', testCommand2.data,
          'updates', testCommand2.data_updates,
          'previous', testCommand2.data_previous,
          'applied', testCommand2.data_applied,
          'changed', testCommand2.data_changed
        )

        done()
      })
      .catch(err => {
        done(err)
      })
  })


  it('should test command with previously undefined value', (done) => {

    const TestBroadcast = global.app.broadcasts.TestBroadcast2
    const req = {}

    let body = {
      string: 'test',
      keyvalue: { hello: 'world' },
      array: ['hello', 'world'],
      child: {
        name: 'test'
      },
      children: [{
        name: 'test'
      }]
    }

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

    testCommand4 = TestBroadcast.createCommand({
      req: req,
      command_type: 'create.change',
      object: global.app.models.TestChange,
      data: body,
      causation_uuid: req.causation_uuid,
      correlation_uuid: req.correlation_uuid,
      metadata: {}
    })

    console.log('BRK command before',
      'data', testCommand4.data,
      'updates', testCommand4.data_updates,
      'previous', testCommand4.data_previous,
      'applied', testCommand4.data_applied,
      'changed', testCommand4.data_changed
    )

    assert.equal(testCommand4.data.string, 'test')
    assert.equal(testCommand4.data.string, testCommand4.data_updates.string)
    // assert.equal(testCommand4.data.number, 0)
    // assert.equal(testCommand4.data.number, testCommand4.data_updates.number)
    assert.deepEqual(testCommand4.data.keyvalue, {hello: 'world'})
    assert.deepEqual(testCommand4.data.keyvalue, testCommand4.data_updates.keyvalue)
    assert.deepEqual(testCommand4.data.array, ['hello', 'world'])
    assert.deepEqual(testCommand4.data.array, testCommand4.data_updates.array)
    assert.ok(testCommand4.data.child)
    assert.ok(testCommand4.data.children)


    testCommand4.reload({})
      .then(() => {
        console.log('BRK command after reload',
          'data', testCommand4.data,
          'updates', testCommand4.data_updates,
          'previous', testCommand4.data_previous,
          'applied', testCommand4.data_applied,
          'changed', testCommand4.data_changed
        )

        assert.equal(testCommand4.data.string, 'test')
        assert.equal(testCommand4.data.string, testCommand4.data_applied.string)
        assert.equal(testCommand4.data.string, testCommand4.data_updates.string)

        // assert.equal(testCommand4.data.number, 0)
        // assert.equal(testCommand4.data.number, testCommand4.data_applied.number)
        // assert.equal(testCommand4.data.number, testCommand4.data_updates.number)

        assert.deepEqual(testCommand4.data.keyvalue, {hello: 'world'})
        assert.deepEqual(testCommand4.data.keyvalue, testCommand4.data_applied.keyvalue)
        assert.deepEqual(testCommand4.data.keyvalue, testCommand4.data_updates.keyvalue)

        assert.deepEqual(testCommand4.data.array, ['hello', 'world'])
        assert.deepEqual(testCommand4.data.array, testCommand4.data_applied.array)
        assert.deepEqual(testCommand4.data.array, testCommand4.data_updates.array)

        assert.ok(testCommand4.data.child)
        assert.ok(testCommand4.data.children)

        testCommand4.apply('string', 'test1')
        assert.equal(testCommand4.data.string, 'test1')
        assert.equal(testCommand4.data.string, testCommand4.data_applied.string)
        assert.equal(testCommand4.data_changed.string, null)
        assert.equal(testCommand4.data_previous.string, null)

        testCommand4.apply('number', 1)
        assert.equal(testCommand4.data.number, 1)
        assert.equal(testCommand4.data.number, testCommand4.data_applied.number)
        assert.equal(testCommand4.data.number, testCommand4.data_updates.number)
        assert.equal(testCommand4.data_changed.number, null)
        assert.equal(testCommand4.data_previous.number, null)

        testCommand4.apply('keyvalue', {hello: 'earth'})
        assert.deepEqual(testCommand4.data.keyvalue, {hello: 'earth'})
        assert.deepEqual(testCommand4.data.keyvalue, testCommand4.data_applied.keyvalue)
        assert.deepEqual(testCommand4.data.keyvalue, testCommand4.data_updates.keyvalue)
        assert.deepEqual(testCommand4.data_changed.keyvalue, null)
        assert.deepEqual(testCommand4.data_previous.keyvalue, null)

        testCommand4.apply('array', ['hello', 'earth'])
        assert.deepEqual(testCommand4.data.array, ['hello', 'earth'])
        assert.deepEqual(testCommand4.data.array, testCommand4.data_applied.array)
        assert.deepEqual(testCommand4.data.array, testCommand4.data_updates.array)
        assert.deepEqual(testCommand4.data_changed.array, null)
        assert.deepEqual(testCommand4.data_previous.array, null)

        console.log('BRK command changes', testCommand4.changes())
        assert.deepEqual(testCommand4.changes(), ['test_uuid', 'string', 'number', 'keyvalue', 'array'])
        assert.deepEqual(testCommand4.metadata.changes, ['test_uuid', 'string', 'number', 'keyvalue', 'array'])

        return testCommand4.data.save()
      })
      .then(() => {

        // testCommand4.restage()
        //
        // console.log('BRK command after restage', testCommand4)

        done()
      })
      .catch(err => {
        done(err)
      })
  })

  it('should test command.broadcast', (done) => {

    const TestBroadcast = global.app.broadcasts.TestBroadcast2
    const validator = {
      'create.change': (data) => Validator.joiPromise(data, joi.object()),
    }
    const req = {}

    let body = {
      string: 'test',
      number: 0,
      keyvalue: {hello: 'world'},
      array: ['hello', 'world'],
      child: {
        name: 'test'
      },
      children: [{
        name: 'test'
      }]
    }

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

    testCommand3 = TestBroadcast.createCommand({
      req: req,
      command_type: 'create.change',
      object: global.app.models.TestChange,
      data: body,
      causation_uuid: req.causation_uuid,
      correlation_uuid: req.correlation_uuid,
      event_type: 'change.created',
      metadata: {}
    }, {
      beforeHooks: 'Test.beforeHooksTest'
    })

    assert.equal(testCommand3.data.string, testCommand3.data_updates.string)
    assert.equal(testCommand3.data.number, testCommand3.data_updates.number)
    assert.deepEqual(testCommand3.data.keyvalue, testCommand3.data_updates.keyvalue)
    assert.ok(testCommand3.data.child)
    assert.ok(testCommand3.data.children)

    testCommand3.broadcast(validator, {})
      .then(([_event, _options]) => {
        console.log('BRK broadcasted', _event.data, _options)


        assert.deepEqual(_event.metadata.changes, ['test_uuid', 'string', 'number', 'keyvalue', 'array'])

        assert.equal(_event.data.string, testCommand3.data_updates.string)
        assert.equal(_event.data.number, testCommand3.data_updates.number)
        assert.deepEqual(_event.data.keyvalue, testCommand3.data_updates.keyvalue)
        assert.ok(_event.data.child)
        assert.ok(_event.data.children)

        done()
      })
      .catch(err => {
        done(err)
      })
  })
})
