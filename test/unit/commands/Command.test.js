'use strict'
/* global describe, it */
const assert = require('assert')
const uuid = require('uuid/v4')
const Validator = require('../../../dist/validator').Validator

describe('Entry', () => {
  let test_uuid, testCommand1, testCommand2, testCommand3

  it('should have broadcasters in test', () => {
    assert(global.app.broadcaster)
    assert(global.app.broadcasts)
    assert(global.app.broadcasts.TestBroadcast2)
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

    console.log('BRK command before',
      'data', testCommand1.data,
      'updates', testCommand1.data_updates,
      'previous', testCommand1.data_previous,
      'applied', testCommand1.data_applied,
      'changed', testCommand1.data_changed
    )

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


    testCommand1.reload({})
      .then(() => {
        console.log('BRK command after reload',
          'data', testCommand1.data,
          'updates', testCommand1.data_updates,
          'previous', testCommand1.data_previous,
          'applied', testCommand1.data_applied,
          'changed', testCommand1.data_changed
        )

        assert.equal(testCommand1.data.string, 'test')
        assert.equal(testCommand1.data.string, testCommand1.data_applied.string)
        assert.equal(testCommand1.data.string, testCommand1.data_updates.string)

        assert.equal(testCommand1.data.number, 0)
        assert.equal(testCommand1.data.number, testCommand1.data_applied.number)
        assert.equal(testCommand1.data.number, testCommand1.data_updates.number)

        assert.deepEqual(testCommand1.data.keyvalue, {hello: 'world'})
        assert.deepEqual(testCommand1.data.keyvalue, testCommand1.data_applied.keyvalue)
        assert.deepEqual(testCommand1.data.keyvalue, testCommand1.data_updates.keyvalue)

        assert.deepEqual(testCommand1.data.array, ['hello', 'world'])
        assert.deepEqual(testCommand1.data.array, testCommand1.data_applied.array)
        assert.deepEqual(testCommand1.data.array, testCommand1.data_updates.array)

        assert.ok(testCommand1.data.child)
        assert.ok(testCommand1.data.children)

        testCommand1.apply('string', 'test1')
        assert.equal(testCommand1.data.string, 'test1')
        assert.equal(testCommand1.data.string, testCommand1.data_applied.string)
        assert.equal(testCommand1.data_changed.string, 'test')
        assert.equal(testCommand1.data_previous.string, 'test')

        testCommand1.apply('number', 1)
        assert.equal(testCommand1.data.number, 1)
        assert.equal(testCommand1.data.number, testCommand1.data_applied.number)
        assert.equal(testCommand1.data.number, testCommand1.data_updates.number)
        assert.equal(testCommand1.data_changed.number, 0)
        assert.equal(testCommand1.data_previous.number, 0)

        testCommand1.apply('keyvalue', {hello: 'earth'})
        assert.deepEqual(testCommand1.data.keyvalue, {hello: 'earth'})
        assert.deepEqual(testCommand1.data.keyvalue, testCommand1.data_applied.keyvalue)
        assert.deepEqual(testCommand1.data.keyvalue, testCommand1.data_updates.keyvalue)
        assert.deepEqual(testCommand1.data_changed.keyvalue, {hello: 'world'})
        assert.deepEqual(testCommand1.data_previous.keyvalue, {hello: 'world'})

        testCommand1.apply('array', ['hello', 'earth'])
        assert.deepEqual(testCommand1.data.array, ['hello', 'earth'])
        assert.deepEqual(testCommand1.data.array, testCommand1.data_applied.array)
        assert.deepEqual(testCommand1.data.array, testCommand1.data_updates.array)
        assert.deepEqual(testCommand1.data_changed.array, ['hello', 'world'])
        assert.deepEqual(testCommand1.data_previous.array, ['hello', 'world'])

        console.log('BRK command changes', testCommand1.changes())
        assert.deepEqual(testCommand1.changes(), ['test_uuid', 'string', 'number', 'keyvalue', 'array', 'createdAt', 'updatedAt'])
        assert.deepEqual(testCommand1.metadata.changes, ['test_uuid', 'string', 'number', 'keyvalue', 'array', 'createdAt', 'updatedAt'])

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

    assert.ok(testCommand1.data.child)
    assert.ok(testCommand1.data.children)


    console.log('BRK command before 2',
      'data', testCommand1.data,
      'updates', testCommand1.data_updates,
      'previous', testCommand1.data_previous,
      'applied', testCommand1.data_applied,
      'changed', testCommand1.data_changed
    )


    testCommand1.reload({})
      .then(() => {
        console.log('BRK command after reload 2',
          'data', testCommand1.data,
          'updates', testCommand1.data_updates,
          'previous', testCommand1.data_previous,
          'applied', testCommand1.data_applied,
          'changed', testCommand1.data_changed
        )

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

        console.log('BRK command after restage',
          'data', testCommand1.data,
          'updates', testCommand1.data_updates,
          'previous', testCommand1.data_previous,
          'applied', testCommand1.data_applied,
          'changed', testCommand1.data_changed
        )

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
        assert.equal(testCommand2.data_changed[0].string, 'test')
        assert.equal(testCommand2.data_previous[0].string, 'test')

        testCommand2.apply('0.number', 1)
        assert.equal(testCommand2.data[0].number, 1)
        assert.equal(testCommand2.data[0].number, testCommand2.data_applied[0].number)
        assert.equal(testCommand2.data[0].number, testCommand2.data_updates[0].number)
        assert.equal(testCommand2.data_changed[0].number, 0)
        assert.equal(testCommand2.data_previous[0].number, 0)

        testCommand2.apply('0.keyvalue', {hello: 'earth'})
        assert.deepEqual(testCommand2.data[0].keyvalue, {hello: 'earth'})
        assert.deepEqual(testCommand2.data[0].keyvalue, testCommand2.data_applied[0].keyvalue)
        assert.deepEqual(testCommand2.data[0].keyvalue, testCommand2.data_updates[0].keyvalue)
        assert.deepEqual(testCommand2.data_changed[0].keyvalue, {hello: 'world'})
        assert.deepEqual(testCommand2.data_previous[0].keyvalue, {hello: 'world'})

        console.log('BRK command changes', testCommand2.changes())
        assert.deepEqual(testCommand2.changes(), [['test_uuid', 'string', 'number', 'keyvalue', 'array', 'createdAt', 'updatedAt']])
        assert.deepEqual(testCommand2.metadata.changes, [['test_uuid', 'string', 'number', 'keyvalue', 'array', 'createdAt', 'updatedAt']])

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
