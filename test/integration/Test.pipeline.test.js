'use strict'
/* global describe, it */
const assert = require('assert')
const uuid = require('uuid/v4')

describe('pipeline', () => {
  it('should exist', () => {
    assert(global.app.pipelines)
    assert(global.app.pipelines.TestPipeline)
  })

  it('should run emitters', (done) => {
    const sub = global.app.broadcasts.Test.subscribe(
      'CreateAndFindTest', {}, {
        name: 'test'
      }, {
        useMaster: true
      }
    )

    sub.on('progress', (name, step, total) => {
      global.app.log.debug('Test.CreateAndFindTest progress', name, step, total)
    })

    sub.on('subprogress', (name, step, total) => {
      global.app.log.debug('Test.CreateAndFindTest subprogress', name, step, total)
    })

    sub.once('complete', (_req, _body, _options) => {
      console.log('brk pipeline complete', _req, _body, _options)

      assert.equal(_body.name, 'test')
      assert.equal(_body.event_type, 'test.created')
      assert.ok(_body.data.test_uuid)
      assert.equal(_body.data.name, 'test')

      done()
    })

    sub.once('failure', (err) => {
      done(err)
    })
  })


  it('should skip emitters', (done) => {
    const sub = global.app.broadcasts.Test.subscribe(
      'Skip', {}, {
        name: 'test'
      }, {
        useMaster: true
      }
    )

    sub.on('progress', (name, step, total) => {
      global.app.log.debug('Test.Skip progress', name, step, total)
    })

    sub.on('subprogress', (name, step, total) => {
      global.app.log.debug('Test.Skip subprogress', name, step, total)
    })

    sub.once('complete', (_req, _body, _options) => {
      console.log('brk pipeline complete', _req, _body, _options)
      assert.equal(_body.name, 'test')
      done()
    })

    sub.once('failure', (err) => {
      done(err)
    })
  })
})
