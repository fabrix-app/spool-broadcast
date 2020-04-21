'use strict'
/* global describe, it */
const assert = require('assert')


describe('pipeline', () => {
  it('should exist', () => {
    assert(global.app.pipelines)
    assert(global.app.pipelines.TestPipeline)
    // assert(global.app2.pipelines)
    // assert(global.app2.pipelines.TestPipeline)
  })

  it('should run emitters and distribute the eventual events', (done) => {
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

      const traced = global.app.broadcasts.Test.unnestTrace(_options)
      const flat = global.app.broadcasts.Test.flattenTrace(_options)

      console.log('BRK TRACED', traced)
      console.log('BRK TRACED FLAT', flat)

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
})
