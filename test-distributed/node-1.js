'use strict'

const FabrixApp = require('@fabrix/fabrix').FabrixApp

const fixture = require('../test/fixtures/app')
fixture.pkg.name = 'node-1'
fixture.config.web.port = '3001'
fixture.config.stores.sequelize.migrate = false

const app =  new FabrixApp(fixture)

// receive message from master process
process.on('message', async (message) => {
  if (message.start) {
    app.start()
      .then(() => {
        process.send({ started: true })
      })
      .catch(err => {
        app.stop(err)
        process.send({ stopped: err })
      })
  }
  else if (message.stop) {
    app.stop()
      .then(() => {
        process.send({ stopped: true })
      })
      .catch(err => {
        process.send({ stopped: err })
      })
  }
  else {
    console.log('Bad Message', message)
  }
})
