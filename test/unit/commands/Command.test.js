'use strict'
/* global describe, it */
const assert = require('assert')
const uuid = require('uuid/v4')
const Validator = require('../../../dist/validator').Validator
const joi = require('@hapi/joi')

describe('Command', () => {
  let test_uuid, testCommand1, testCommand2, testCommand3, testCommand4, testCommand5, testCommand6, testCommand7

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

    testCommand1 = TestBroadcast.createCommand({
      req: req,
      command_type: 'create.change',
      object: global.app.models.TestChange,
      data: body,
      causation_uuid: req.causation_uuid,
      correlation_uuid: req.correlation_uuid,
      metadata: {}
    })

    testCommand1.hooks = [{prehook_url: 'example.com'}]

    console.log('*********************************')
    console.log('BRK command create before reload')
    console.log('data', testCommand1.data)
    console.log('updates', testCommand1.data_updates)
    console.log('previous', testCommand1.data_previous)
    console.log('applied', testCommand1.data_applied)
    console.log('changed', testCommand1.data_changed)
    console.log('*********************************')

    assert.deepEqual(testCommand1.hooks, [{prehook_url: 'example.com'}])
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


        testCommand1.createdAt()

        console.log('BRK command changes', testCommand1.changes())
        assert.equal(testCommand1.changes('test_uuid'), 'test_uuid')
        assert.equal(testCommand1.changes('array'), 'array')
        assert.deepEqual(testCommand1.changes(), ['test_uuid', 'string', 'number', 'keyvalue', 'array', 'created_at', 'updated_at', 'deleted_at'])
        assert.deepEqual(testCommand1.metadata.changes, ['test_uuid', 'string', 'number', 'keyvalue', 'array', 'created_at', 'updated_at', 'deleted_at'])

        assert.equal(testCommand1.hasChanges(), true)

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
      event_type: 'change.created',
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

        testCommand1.approveUpdates(['string', 'number', 'keyvalue', 'array'])

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

        testCommand1.createdAt() // Should do nothing
        testCommand1.updatedAt()

        assert.ok(testCommand1.data.child)
        assert.ok(testCommand1.data.children)

        console.log('BRK command changes', testCommand1.changes(), 'dataPrevious', testCommand1.changedPreviousData())
        assert.deepEqual(testCommand1.changes(), ['string', 'number', 'keyvalue', 'array', 'updated_at'])
        assert.deepEqual(testCommand1.metadata.changes, ['string', 'number', 'keyvalue', 'array', 'updated_at'])
        assert.deepEqual(testCommand1.changedPreviousData(), {string: 'test1', number: 1, keyvalue: {hello: 'earth'}, array: ['hello', 'earth'], updated_at: null})

        assert.equal(testCommand1.hasChanges(), true)

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

  it('should test command on update object (toEvent)', (done) => {
    const event = testCommand1.broadcaster.buildEvent({
      event_type: testCommand1._event_type,
      correlation_uuid: testCommand1.command_uuid,
      command: testCommand1
    })
    console.log('BRK CREATED EVENT PREVIOUSLY', event.changes(), event.previously())
    assert.deepEqual(event.changes(), ['string', 'number', 'keyvalue', 'array', 'updated_at'])
    assert.deepEqual(event.previously(), {string: 'test1', number: 1, keyvalue: {hello: 'earth'}, array: ['hello', 'earth'], updated_at: null})

    assert.equal(event.changes('string'), true)
    assert.equal(event.previously('string'), 'test1')

    done()
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
    } catch (err) {
      done(err)
    }

    testCommand1 = TestBroadcast.createCommand({
      req: req,
      command_type: 'create.change',
      event_type: 'change.created',
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

        testCommand1.approveUpdates(['string', 'number', 'keyvalue', 'array'])

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

        console.log('BRK command changes', testCommand1.changes(),
          'previousData', testCommand1.changedPreviousData())
        assert.deepEqual(testCommand1.changes(), [])
        assert.deepEqual(testCommand1.metadata.changes, [])

        testCommand1.createdAt() // Should do nothing
        testCommand1.updatedAt()

        assert.equal(testCommand1.hasChanges(), false)

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

  it('should test command on no update object (toEvent)', (done) => {
    const event = testCommand1.broadcaster.buildEvent({
      event_type: testCommand1._event_type,
      correlation_uuid: testCommand1.command_uuid,
      command: testCommand1
    })
    console.log('BRK CREATED EVENT PREVIOUSLY', event.changes(), event.previously())
    assert.deepEqual(event.changes(), [])
    assert.deepEqual(event.previously(), {})

    done()
  })


  it('should test command on new object list', (done) => {

    const TestBroadcast = global.app.broadcasts.TestBroadcast2
    const req = {}

    let body = [{
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
      command_type: 'create.change.list',
      event_type: 'change.created.list',
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

        testCommand1.createdAt()
        testCommand1.updatedAt() // should do nothing because this is a new record

        console.log('BRK command changes', testCommand2.changes(),
          'previousData', testCommand2.changedPreviousData())
        assert.deepEqual(testCommand2.changes(), [['test_uuid', 'string', 'number', 'keyvalue', 'array', 'created_at', 'updated_at', 'deleted_at']])
        assert.deepEqual(testCommand2.metadata.changes, [['test_uuid', 'string', 'number', 'keyvalue', 'array', 'created_at', 'updated_at', 'deleted_at']])

        assert.equal(testCommand2.hasChanges(0), true)

        return testCommand2.broadcastSeries(testCommand2.data, (d) => {
          return d.save()
        })
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

  it('should test command on list create object (toEvent)', (done) => {
    const event = testCommand2.broadcaster.buildEvent({
      event_type: testCommand2._event_type,
      correlation_uuid: testCommand2.command_uuid,
      command: testCommand2
    })
    console.log('BRK CREATED EVENT PREVIOUSLY', event.changes(), event.previously())
    assert.deepEqual(event.changes(), [['test_uuid', 'string', 'number', 'keyvalue', 'array']])
    assert.deepEqual(event.previously(), [{ test_uuid: null, string: null, number: null, keyvalue: null, array: null }])

    done()
  })

  it('should test command on update object list', (done) => {

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
      command_type: 'create.change.list',
      event_type: 'change.created.list',
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
          'changed', testCommand2.data_changed,
          'previousData', testCommand2.changedPreviousData()
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

        testCommand2.approveUpdates(['string', 'number', 'keyvalue'])

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

        testCommand2.createdAt() // Should do nothing because this an update
        testCommand2.updatedAt()

        console.log('BRK command changes', testCommand2.changes(),
          'previousData', testCommand2.changedPreviousData())
        assert.deepEqual(testCommand2.changes(), [['string', 'number', 'keyvalue', 'updated_at']])
        assert.deepEqual(testCommand2.metadata.changes, [['string', 'number', 'keyvalue', 'updated_at']])
        assert.deepEqual(testCommand2.changedPreviousData(), [{string: 'test1', number: 1, keyvalue: {hello: 'earth'}, updated_at: null}])

        return testCommand2.broadcastSeries(testCommand2.data, (d) => {
          return d.save()
        })
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

  it('should test command on list update object (toEvent)', (done) => {
    const event = testCommand2.broadcaster.buildEvent({
      event_type: testCommand2._event_type,
      correlation_uuid: testCommand2.command_uuid,
      command: testCommand2
    })
    console.log('BRK CREATED EVENT PREVIOUSLY', event.changes(), event.previously())
    assert.deepEqual(event.changes(), [['string', 'number', 'keyvalue', 'updated_at']])
    assert.deepEqual(event.previously(), [{string: 'test1', number: 1, keyvalue: {hello: 'earth'}, updated_at: null}])

    assert.equal(event.changes('0.string'), true)
    assert.equal(event.changes('string'), true) // Did any list instance of string change
    assert.equal(event.previously('0.string'), 'test1')

    done()
  })


  it('should test command with previously undefined value', (done) => {

    const TestBroadcast = global.app.broadcasts.TestBroadcast2
    const req = {}

    let body = {
      string: 'test',
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
          'changed', testCommand4.data_changed,
          'previousData', testCommand4.changedPreviousData()
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

        console.log('BRK command changes', testCommand4.changes(),
          'previousData', testCommand4.changedPreviousData())
        assert.deepEqual(testCommand4.changes(), ['test_uuid', 'string', 'number', 'keyvalue', 'array', 'created_at', 'updated_at', 'deleted_at'])
        assert.deepEqual(testCommand4.metadata.changes, ['test_uuid', 'string', 'number', 'keyvalue', 'array', 'created_at', 'updated_at', 'deleted_at'])

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


        assert.deepEqual(_event.metadata.changes, ['test_uuid', 'string', 'number', 'keyvalue', 'array', 'created_at', 'updated_at', 'deleted_at'])

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

  describe('Test hasChanges', function() {
    it('should test command on new object (hasChanges)', (done) => {

      const TestBroadcast = global.app.broadcasts.TestBroadcast2
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

      testCommand5 = TestBroadcast.createCommand({
        req: req,
        command_type: 'create.change',
        object: global.app.models.TestChange,
        data: body,
        causation_uuid: req.causation_uuid,
        correlation_uuid: req.correlation_uuid,
        metadata: {}
      })

      testCommand5.hooks = [{prehook_url: 'example.com'}]

      console.log('*********************************')
      console.log('BRK command create before reload')
      console.log('data', testCommand5.data)
      console.log('updates', testCommand5.data_updates)
      console.log('previous', testCommand5.data_previous)
      console.log('applied', testCommand5.data_applied)
      console.log('changed', testCommand5.data_changed)
      console.log('*********************************')

      assert.deepEqual(testCommand5.hooks, [{prehook_url: 'example.com'}])
      assert.deepEqual(testCommand5.metadata.hooks, testCommand5.hooks)

      assert.equal(testCommand5.data.string, 'test')
      assert.equal(testCommand5.data.string, testCommand5.data_updates.string)
      assert.equal(testCommand5.data.number, 0)
      assert.equal(testCommand5.data.number, testCommand5.data_updates.number)
      assert.deepEqual(testCommand5.data.keyvalue, {hello: 'world'})
      assert.deepEqual(testCommand5.data.keyvalue, testCommand5.data_updates.keyvalue)
      assert.deepEqual(testCommand5.data.array, ['hello', 'world'])
      assert.deepEqual(testCommand5.data.array, testCommand5.data_updates.array)
      assert.ok(testCommand5.data.child)
      assert.ok(testCommand5.data.children)

      assert.deepEqual(testCommand5.data_previous, {})
      assert.deepEqual(testCommand5.data_applied, {})
      assert.deepEqual(testCommand5.data_changed, {})

      // console.log('BRK UNAPPLIED', testCommand5.unapplied())
      // console.log('BRK UPDATED', testCommand5.updated())


      testCommand5.reload({})
        .then(() => {

          console.log('*********************************')
          console.log('BRK command create after reload')
          console.log('data', testCommand5.data)
          console.log('updates', testCommand5.data_updates)
          console.log('previous', testCommand5.data_previous)
          console.log('applied', testCommand5.data_applied)
          console.log('changed', testCommand5.data_changed)
          console.log('*********************************')

          assert.equal(testCommand5.data.string, 'test')
          assert.equal(testCommand5.data.string, testCommand5.data_applied.string)
          assert.equal(testCommand5.data.string, testCommand5.data_updates.string)
          assert.equal(testCommand5.data_previous.string, null)
          assert.equal(testCommand5.data_changed.string, null)

          assert.equal(testCommand5.data.number, 0)
          assert.equal(testCommand5.data.number, testCommand5.data_applied.number)
          assert.equal(testCommand5.data.number, testCommand5.data_updates.number)
          assert.equal(testCommand5.data_previous.number, null)
          assert.equal(testCommand5.data_changed.number, null)

          assert.deepEqual(testCommand5.data.keyvalue, {hello: 'world'})
          assert.deepEqual(testCommand5.data.keyvalue, testCommand5.data_applied.keyvalue)
          assert.deepEqual(testCommand5.data.keyvalue, testCommand5.data_updates.keyvalue)
          assert.equal(testCommand5.data_previous.keyvalue, null)
          assert.equal(testCommand5.data_changed.keyvalue, null)

          assert.deepEqual(testCommand5.data.array, ['hello', 'world'])
          assert.deepEqual(testCommand5.data.array, testCommand5.data_applied.array)
          assert.deepEqual(testCommand5.data.array, testCommand5.data_updates.array)
          assert.equal(testCommand5.data_previous.array, null)
          assert.equal(testCommand5.data_changed.array, null)

          assert.ok(testCommand5.data.child)
          assert.ok(testCommand5.data.children)

          assert.equal(testCommand5.hasChanges(), true)

          return testCommand5.data.save()
        })
        .then(() => {
          // testCommand5.restage()
          //
          // console.log('BRK command after restage', testCommand5)

          done()
        })
        .catch(err => {
          done(err)
        })
    })

    it('should test command on updated object (hasChanges)', (done) => {

      const TestBroadcast = global.app.broadcasts.TestBroadcast2
      const req = {}

      let body = {
        ...JSON.parse(JSON.stringify(testCommand5.data)),
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

      testCommand5 = TestBroadcast.createCommand({
        req: req,
        command_type: 'create.change',
        object: global.app.models.TestChange,
        data: body,
        causation_uuid: req.causation_uuid,
        correlation_uuid: req.correlation_uuid,
        metadata: {}
      })

      testCommand5.hooks = [{prehook_url: 'example.com'}]

      console.log('*********************************')
      console.log('BRK command create before reload')
      console.log('data', testCommand5.data)
      console.log('updates', testCommand5.data_updates)
      console.log('previous', testCommand5.data_previous)
      console.log('applied', testCommand5.data_applied)
      console.log('changed', testCommand5.data_changed)
      console.log('*********************************')

      assert.deepEqual(testCommand5.hooks, [{prehook_url: 'example.com'}])
      assert.deepEqual(testCommand5.metadata.hooks, testCommand5.hooks)

      assert.equal(testCommand5.data.string, 'test')
      assert.equal(testCommand5.data.string, testCommand5.data_updates.string)
      assert.equal(testCommand5.data.number, 0)
      assert.equal(testCommand5.data.number, testCommand5.data_updates.number)
      assert.deepEqual(testCommand5.data.keyvalue, {hello: 'world'})
      assert.deepEqual(testCommand5.data.keyvalue, testCommand5.data_updates.keyvalue)
      assert.deepEqual(testCommand5.data.array, ['hello', 'world'])
      assert.deepEqual(testCommand5.data.array, testCommand5.data_updates.array)
      assert.ok(testCommand5.data.child)
      assert.ok(testCommand5.data.children)

      assert.deepEqual(testCommand5.data_previous, {})
      assert.deepEqual(testCommand5.data_applied, {})
      assert.deepEqual(testCommand5.data_changed, {})

      // console.log('BRK UNAPPLIED', testCommand5.unapplied())
      // console.log('BRK UPDATED', testCommand5.updated())


      testCommand5.reload({})
        .then(() => {

          console.log('*********************************')
          console.log('BRK command create after reload')
          console.log('data', testCommand5.data)
          console.log('updates', testCommand5.data_updates)
          console.log('previous', testCommand5.data_previous)
          console.log('applied', testCommand5.data_applied)
          console.log('changed', testCommand5.data_changed)
          console.log('*********************************')

          assert.equal(testCommand5.data.string, 'test')
          assert.equal(testCommand5.data_applied.string, undefined)
          assert.equal(testCommand5.data_updates.string, testCommand5.data.string)
          assert.equal(testCommand5.data_previous.string, testCommand5.data.string)
          assert.equal(testCommand5.data_changed.string, null)

          assert.equal(testCommand5.data.number, 0)
          assert.equal(testCommand5.data_applied.number, undefined)
          assert.equal(testCommand5.data_updates.number, testCommand5.data.number)
          assert.equal(testCommand5.data_previous.number, testCommand5.data.number)
          assert.equal(testCommand5.data_changed.number, null)

          assert.deepEqual(testCommand5.data.keyvalue, {hello: 'world'})
          assert.equal(testCommand5.data_applied.keyvalue, undefined)
          assert.deepEqual(testCommand5.data_updates.keyvalue, testCommand5.data.keyvalue)
          assert.deepEqual(testCommand5.data_previous.keyvalue, testCommand5.data.keyvalue)
          assert.equal(testCommand5.data_changed.keyvalue, null)

          assert.deepEqual(testCommand5.data.array, ['hello', 'world'])
          assert.equal(testCommand5.data_applied.array, undefined)
          assert.deepEqual(testCommand5.data_updates.array, testCommand5.data.array)
          assert.deepEqual(testCommand5.data_previous.array, testCommand5.data.array)
          assert.equal(testCommand5.data_changed.array, null)

          assert.ok(testCommand5.data.child)
          assert.ok(testCommand5.data.children)

          testCommand5.createdAt() // Should do nothing
          testCommand5.updatedAt()

          // assert.equal(testCommand5.hasChanges(), false)

          return testCommand5.data.save()
        })
        .then(() => {
          // testCommand5.restage()
          //
          // console.log('BRK command after restage', testCommand5)

          done()
        })
        .catch(err => {
          done(err)
        })
    })
  })

  describe('Test Synthetic', function() {
    it('should test command on new synthetic object', (done) => {

      const TestBroadcast = global.app.broadcasts.TestBroadcast2
      const req = {}

      let body = {
        test: 'test'
      }

      // Build a permission instance
      body = global.app.models.TestSynthetic.stage(body, {
        isNewRecord: true,
        before: [function (d, opts) {
          d.before = '1'
          return d
        }],
        after: [function (d, opts) {
          d.after = '1'
          return d
        }],
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

      assert.equal(body.before, '1')
      assert.equal(body.after, '1')

      testCommand6 = TestBroadcast.createCommand({
        req: req,
        command_type: 'create.change',
        object: global.app.models.TestSynthetic,
        data: body,
        causation_uuid: req.causation_uuid,
        correlation_uuid: req.correlation_uuid,
        metadata: {}
      })

      testCommand6.hooks = [{prehook_url: 'example.com'}]

      console.log('*********************************')
      console.log('BRK command create before reload')
      console.log('data', testCommand6.data)
      console.log('updates', testCommand6.data_updates)
      console.log('previous', testCommand6.data_previous)
      console.log('applied', testCommand6.data_applied)
      console.log('changed', testCommand6.data_changed)
      console.log('*********************************')

      assert.deepEqual(testCommand6.hooks, [{prehook_url: 'example.com'}])
      assert.deepEqual(testCommand6.metadata.hooks, testCommand6.hooks)

      testCommand6.reload({})
        .then(() => {

          console.log('*********************************')
          console.log('BRK command create after reload')
          console.log('data', testCommand6.data)
          console.log('updates', testCommand6.data_updates)
          console.log('previous', testCommand6.data_previous)
          console.log('applied', testCommand6.data_applied)
          console.log('changed', testCommand6.data_changed)
          console.log('*********************************')

          done()
        })
        .catch(err => {
          done(err)
        })
    })

    it('should test command on update synthetic object', (done) => {

      const TestBroadcast = global.app.broadcasts.TestBroadcast2
      const req = {}

      let body = {
        test: 'test'
      }

      // Build a permission instance
      body = global.app.models.TestSynthetic.stage(body, {
        isNewRecord: false,
        before: [function (d, opts) {
          d.before = '2'
          return d
        }],
        after: [function (d, opts) {
          d.after = '2'
          return d
        }],
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

      assert.equal(body.before, '2')
      assert.equal(body.after, '2')

      testCommand6 = TestBroadcast.createCommand({
        req: req,
        command_type: 'create.change',
        object: global.app.models.TestSynthetic,
        data: body,
        causation_uuid: req.causation_uuid,
        correlation_uuid: req.correlation_uuid,
        metadata: {}
      })

      testCommand6.hooks = [{prehook_url: 'example.com'}]

      console.log('*********************************')
      console.log('BRK command update before reload')
      console.log('data', testCommand6.data)
      console.log('updates', testCommand6.data_updates)
      console.log('previous', testCommand6.data_previous)
      console.log('applied', testCommand6.data_applied)
      console.log('changed', testCommand6.data_changed)
      console.log('*********************************')

      assert.deepEqual(testCommand6.hooks, [{prehook_url: 'example.com'}])
      assert.deepEqual(testCommand6.metadata.hooks, testCommand6.hooks)

      testCommand6.reload({})
        .then(() => {

          console.log('*********************************')
          console.log('BRK command update after reload')
          console.log('data', testCommand6.data)
          console.log('updates', testCommand6.data_updates)
          console.log('previous', testCommand6.data_previous)
          console.log('applied', testCommand6.data_applied)
          console.log('changed', testCommand6.data_changed)
          console.log('*********************************')

          done()
        })
        .catch(err => {
          done(err)
        })
    })
  })

  describe('Test Private', function() {
    it('should test command on new private object', (done) => {

      const TestBroadcast = global.app.broadcasts.TestBroadcast2
      const req = {}

      let body = {
        test: 'test'
      }

      // Build a permission instance
      body = global.app.models.TestPrivate.stage(body, {
        isNewRecord: true,
        before: [function (d, opts) {
          d.before = '1'
          return d
        }],
        after: [function (d, opts) {
          d.after = '1'
          return d
        }],
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

      assert.equal(body.before, '1')
      assert.equal(body.after, '1')

      testCommand7 = TestBroadcast.createCommand({
        req: req,
        command_type: 'create.change',
        object: global.app.models.TestPrivate,
        data: body,
        causation_uuid: req.causation_uuid,
        correlation_uuid: req.correlation_uuid,
        metadata: {}
      })

      testCommand7.hooks = [{prehook_url: 'example.com'}]

      console.log('*********************************')
      console.log('BRK command create before reload')
      console.log('data', testCommand7.data)
      console.log('updates', testCommand7.data_updates)
      console.log('previous', testCommand7.data_previous)
      console.log('applied', testCommand7.data_applied)
      console.log('changed', testCommand7.data_changed)
      console.log('*********************************')

      assert.deepEqual(testCommand7.hooks, [{prehook_url: 'example.com'}])
      assert.deepEqual(testCommand7.metadata.hooks, testCommand7.hooks)

      testCommand7.reload({})
        .then(() => {

          console.log('*********************************')
          console.log('BRK command create after reload')
          console.log('data', testCommand7.data)
          console.log('updates', testCommand7.data_updates)
          console.log('previous', testCommand7.data_previous)
          console.log('applied', testCommand7.data_applied)
          console.log('changed', testCommand7.data_changed)
          console.log('*********************************')

          done()
        })
        .catch(err => {
          done(err)
        })
    })

    it('should test command on update private object', (done) => {

      const TestBroadcast = global.app.broadcasts.TestBroadcast2
      const req = {}

      let body = {
        test: 'test'
      }

      // Build a permission instance
      body = global.app.models.TestPrivate.stage(body, {
        isNewRecord: true,
        before: [function (d, opts) {
          d.before = '1'
          return d
        }],
        after: [function (d, opts) {
          d.after = '1'
          return d
        }],
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

      console.log('BRK PRV 1', body)

      assert.equal(body.before, '1')
      assert.equal(body.after, '1')

      // Should only run before and after on stage
      body = global.app.models.TestPrivate.stage(body, {
        isNewRecord: true,
        before: [function (d, opts) {
          d.before = '2'
          return d
        }],
        after: [function (d, opts) {
          d.after = '2'
          return d
        }],
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

      console.log('BRK PRV 2', body)
      assert.equal(body.before, '2')
      assert.equal(body.after, '2')

      testCommand7 = TestBroadcast.createCommand({
        req: req,
        command_type: 'create.change',
        object: global.app.models.TestPrivate,
        data: body,
        causation_uuid: req.causation_uuid,
        correlation_uuid: req.correlation_uuid,
        metadata: {}
      })

      testCommand7.hooks = [{prehook_url: 'example.com'}]

      console.log('*********************************')
      console.log('BRK command update before reload')
      console.log('data', testCommand7.data)
      console.log('updates', testCommand7.data_updates)
      console.log('previous', testCommand7.data_previous)
      console.log('applied', testCommand7.data_applied)
      console.log('changed', testCommand7.data_changed)
      console.log('*********************************')

      assert.deepEqual(testCommand7.hooks, [{prehook_url: 'example.com'}])
      assert.deepEqual(testCommand7.metadata.hooks, testCommand7.hooks)

      testCommand7.reload({})
        .then(() => {

          console.log('*********************************')
          console.log('BRK command update after reload')
          console.log('data', testCommand7.data)
          console.log('updates', testCommand7.data_updates)
          console.log('previous', testCommand7.data_previous)
          console.log('applied', testCommand7.data_applied)
          console.log('changed', testCommand7.data_changed)
          console.log('*********************************')

          done()
        })
        .catch(err => {
          done(err)
        })
    })
  })
})
