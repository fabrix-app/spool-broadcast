'use strict'
/* global describe, it */
const assert = require('assert')
const uuid = require('uuid/v4')

describe('pipeline', () => {
  it('should exist', () => {
    assert(global.app.pipelines)
    assert(global.app.pipelines.Test)
  })

  it('should run emitters', (done) => {
    const sub = global.app.broadcasts.Test.subscribe(
      'CreateAndFindTest', {}, {
        name: 'test'
      }, {
        useMaster: true
      }
    )

    sub.on('progress', (step, total) => {
      global.app.log.debug('Test.CreateAndFindTest', step, total)
    })

    sub.once('complete', (_req, _body, _options) => {
      done()
      // res.json({
      //   event_type: _body.event_type,
      //   object: _body.object,
      //   data: _body.data,
      //   url: `${this.prefix()}/channels/${req.params.channel_uuid}/carts/${_body.data.cart_uuid}`,
      //   contains: _body.contains,
      //   annotations: {
      //     pii: {
      //       customer: this.app.models.ChannelCustomer.resolver.options.pii
      //     }
      //   }
      // })
    })

    sub.once('failure', (err) => {
      done(err)
    })
  })
})
