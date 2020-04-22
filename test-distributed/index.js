'use strict'
const Promise = require('bluebird')
const _ = require('lodash')
const FabrixApp = require('@fabrix/fabrix').FabrixApp
const path = require('path')

const { fork } = require('child_process')

// const node1 = fork(path.resolve(__dirname, './node-1.js'))
const node2 = fork(path.resolve(__dirname, './node-2.js'))

const fixture = require('../test/fixtures/app')
fixture.pkg.name = 'node-0'
fixture.config.web.port = '3000'

before(function(done) {

  global.app = new FabrixApp(fixture)

  global.app.start()
    .catch(err => {
      global.app.stop(err)
      return done(err)
    })
    .then(() => {
      return new Promise((resolve, reject) => {

        node2.on('message', (message) => {
          console.log(`node2 message`, message)
          if (message.started) {
            return resolve()
          }
          else if (message.stopped) {
            return reject(message.stopped)
          }
          else {
            console.log('Unexpected message', message)
            return reject()
          }
        })

        node2.send({start: true})
      })
    })
    .catch(err => {
      global.app.stop()

      node2.send({stop: err})
      return done(err)
    })
    .then(() => {
      return done()
    })
})

after(function(done) {
  Promise.all([
    global.app.stop(),
    new Promise((resolve, reject) => {

      node2.on('message', (message) => {
        console.log(`node2 message`, message)
        if (message.stopped) {
          return resolve()
        }
        else {
          console.log('Unexpected message', message)
          return reject()
        }
      })

      node2.send({stop: true})
    })
  ])
    .then(results => {
      node2.kill()
      return done()
    })
    .catch(err => {
      node2.kill()
      return done(err)
    })
})
