'use strict'


const FabrixApp = require('@fabrix/fabrix').FabrixApp
// const assert = require('assert')
// const supertest = require('supertest')

before(function() {
  global.app = new FabrixApp(require('./fixtures/app'))
  return global.app.start().catch(global.app.stop)
})

after(function() {
  console.log('TEST DONE')
  return global.app.stop()
})

