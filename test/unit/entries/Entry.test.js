'use strict'
/* global describe, it */
const assert = require('assert')
const uuid = require('uuid/v4')

describe('Entry', () => {
  let test_uuid

  afterEach(() => {
    console.log('---------------TEST END------------------')
  })

  it('should exist', () => {
    assert(global.app.entries)
    assert(global.app.entries.Test)
    assert(global.app.entries.Broadcast)
  })

  describe('Test Entry', () => {
    it('should create and trigger creating children', (done) => {
      global.app.entries.Test.create({}, {name: 'test'}, {})
        .then(([_event, _options]) => {

          console.log('BRK createMany', _event.data)
          test_uuid = _event.data.test_uuid

          console.log('brk trace', global.app.broadcasts.Test.unnestTrace(_options))
          console.log('brk trace flat', global.app.broadcasts.Test.flattenTrace(_options))

          done()
        })
        .catch(err => {
          done(err)
        })
    })

    it('should bulk create and test aside update', (done) => {
      global.app.entries.Test.bulkCreate({}, [
        {name: 'test'},
        {name: '1test'}
      ], {})
        .then(([_event, _options]) => {

          console.log('brk updateAside', _event.data)

          console.log('brk trace', global.app.broadcasts.Test.unnestTrace(_options))
          console.log('brk trace flat', global.app.broadcasts.Test.flattenTrace(_options))


          assert.equal(_event.data[0].name, 'test0')
          assert.equal(_event.data[1].name, '1test1')

          done()
        })
        .catch(err => {
          done(err)
        })
    })

    it('should update', (done) => {
      global.app.entries.Test.update({}, {
        test_uuid: test_uuid,
        name: 'test 2'
      }, {})
        .then(([_event, _options]) => {

          console.log('brk trace', global.app.broadcasts.Test.unnestTrace(_options))
          console.log('brk trace flat', global.app.broadcasts.Test.flattenTrace(_options))

          done()
        })
        .catch(err => {
          done(err)
        })
    })

    it('should create with params', (done) => {
      global.app.entries.Test.createWithParams({}, {
        test_uuid: uuid(),
        name: 'test'
      }, {})
        .then(([_event, _options]) => {

          console.log('brk trace', global.app.broadcasts.Test.unnestTrace(_options))
          console.log('brk trace flat', global.app.broadcasts.Test.flattenTrace(_options))

          done()
        })
        .catch(err => {
          done(err)
        })
    })

    it('should create with double params', (done) => {
      global.app.entries.Test.createWithDoubleParams({}, {
        test_uuid: uuid(),
        name: 'test'
      }, {})
        .then(([_event, _options]) => {

          console.log('brk trace', global.app.broadcasts.Test.unnestTrace(_options))
          console.log('brk trace flat', global.app.broadcasts.Test.flattenTrace(_options))

          done()
        })
        .catch(err => {
          done(err)
        })
    })

    it('should create without a transaction', (done) => {
      global.app.entries.Test.createNoTransaction({}, {name: 'no-transaction'}, {
        transaction: false
      })
        .then(([_event, _options]) => {

          console.log('BRK no transaction', _event.data)
          test_uuid = _event.data.test_uuid

          console.log('brk trace', global.app.broadcasts.Test.unnestTrace(_options))
          console.log('brk trace flat', global.app.broadcasts.Test.flattenTrace(_options))


          return global.app.models.BroadcastEvent.findByPk(_event.event_uuid)
            .then((_e) => {
              assert.equal(_event.event_uuid, _e.event_uuid)
              done()
            })
        })
        .catch(err => {
          done(err)
        })
    })

    it('should create without saving event', (done) => {
      global.app.entries.Test.createNoSave({}, {name: 'no-save'}, {
        save: false
      })
        .then(([_event, _options]) => {

          console.log('BRK no transaction', _event.data)
          test_uuid = _event.data.test_uuid

          console.log('brk trace', global.app.broadcasts.Test.unnestTrace(_options))
          console.log('brk trace flat', global.app.broadcasts.Test.flattenTrace(_options))


          return global.app.models.BroadcastEvent.findByPk(_event.event_uuid)
            .then((_) => {
              assert.equal(_, null)
              done()
            })
        })
        .catch(err => {
          done(err)
        })
    })

    it('should create without transaction and without saving event', (done) => {
      global.app.entries.Test.createNoSave({}, {name: 'no-save-no-transaction'}, {
        transaction: false,
        save: false
      })
        .then(([_event, _options]) => {

          console.log('BRK no transaction', _event.data)
          test_uuid = _event.data.test_uuid

          console.log('brk trace', global.app.broadcasts.Test.unnestTrace(_options))
          console.log('brk trace flat', global.app.broadcasts.Test.flattenTrace(_options))


          return global.app.models.BroadcastEvent.findByPk(_event.event_uuid)
            .then((_) => {
              assert.equal(_, null)
              done()
            })
        })
        .catch(err => {
          done(err)
        })
    })

    describe('Root Broadcast Entry', () => {
      let event_uuid
      it('should find all created events', (done) => {
        global.app.entries.Broadcast.findAll({}, {
          params: {},
          query: {}
        }, {})
          .then(([res, opt]) => {
            // event_uuid = res.data.find(e => e.causation_uuid).event_uuid
            console.log('BRK RES EVENTS', res)
            done()
          })
          .catch(err => {
            console.log('BRK RES EVENTS err', err)
            done(err)
          })
      })
      // it('should find all event\'s siblings', (done) => {
      //   global.app.entries.Broadcast.siblings({}, {
      //     params: {
      //       event_uuid: event_uuid
      //     },
      //     query: {}
      //   }, {})
      //     .then(([res, opts]) => {
      //       console.log('BRK RES EVENTS siblings', res)
      //       done()
      //     })
      //     .catch(err => {
      //       done(err)
      //     })
      // })
      // it('should find all event\'s children', (done) => {
      //   global.app.entries.Broadcast.children({}, {
      //     params: {
      //       event_uuid: event_uuid
      //     },
      //     query: {}
      //   }, {})
      //     .then(([res, opts]) => {
      //       console.log('BRK RES EVENTS children', res)
      //       done()
      //     })
      //     .catch(err => {
      //       done(err)
      //     })
      // })
    })
  })
})
