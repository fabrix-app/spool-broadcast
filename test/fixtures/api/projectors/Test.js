const Projector = require('../../../../dist').Projector
const Project = require('../../../../dist').Project

class Logger extends Project {
  async run() {
    const test = this.app.models.TestLogger.stage(this.event.data, { isNewRecord: true })
    // return userRole.destroy(this.options)
    return test.save(this.options)
      .then(_e => {
        return [this.event, this.options]
      })
      .catch(err => {
        if (this.consistency === 'eventual') {
          return Promise.reject(err)
        }
        else {
          return [{action: 'retry'}, this.options]
        }
      })
  }
}

class Created extends Project {
  async run() {
    const test = this.event.object.stage(this.event.data, { isNewRecord: true })
    // return userRole.destroy(this.options)
    return test.save(this.options)
      .then(_e => {
        return [this.event, this.options]
      })
      .catch(err => {
        if (this.consistency === 'eventual') {
          return Promise.reject(err)
        }
        else {
          return [{action: 'retry'}, this.options]
        }
      })
  }
}
class Updated extends Project {
  async run() {
    const test = this.event.object.stage(this.event.data, { isNewRecord: false })
    // return userRole.destroy(this.options)
    return test.save(this.options)
      .then(_e => {
        return [this.event, this.options]
      })
      .catch(err => {
        if (this.consistency === 'eventual') {
          return Promise.reject(err)
        }
        else {
          return [{action: 'retry'}, this.options]
        }
      })
  }
}

module.exports = class Test extends Projector {
  logger({event, options, consistency, message}) {
    return new Logger(this.app, event, options, consistency, message)
  }
  created({event, options, consistency, message}) {
    return new Created(this.app, event, options, consistency, message)
  }
  updated({event, options, consistency, message}) {
    return new Updated(this.app, event, options, consistency, message)
  }
}
