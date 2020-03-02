
'use strict'
/* global describe, it */
const assert = require('assert')
const uuid = require('uuid/v4')

describe('Test Projectors', () => {
  describe('Dependencies', () => {
    it('should create', (done) => {
      global.app.entries.Test.createEventual({}, {name: 'test'}, {})
        .then(([_event, _options]) => {

          console.log('brk trace', global.app.broadcasts.Test.unnestTrace(_options))

          done()
        })
        .catch(err => {
          done(err)
        })
    })
  })

  describe('Eventual', () => {
    // Give the eventual events some time to finish
    before((done) => {
      setTimeout(function () {
        done()
      }, 500)
    })

    it('should prove that 3 eventual events were triggered', (done) => {
      global.app.models.TestEventual.findAll({
        where: {
          event_type: 'eventual.tested',
          consistency: 'eventual',
          count: [1, 2, 3]
        }
      })
        .then((res) => {
          console.log('BRK EVENTUAL RESULTS', res)
          assert.ok(res)
          assert.ok(res.length >= 3)
          done()
        })
        .catch(err => {
          done(err)
        })
    })
  })
})
