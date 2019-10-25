const Projector = require('../../../../dist').BroadcastProjector
const Project = require('../../../../dist').BroadcastProject

class Logger extends Project {
  async run() {
    console.log('BRK LOGGED!', this.event.data)

    const test = this.app.models.TestLogger.stage({
      event_type: this.event.event_type,
      event_uuid: this.event.event_uuid,
      causation_uuid: this.event.causation_uuid,
      correlation_uuid: this.event.correlation_uuid,
      req_user_uuid: this.event.metadata.req_user_uuid,
      req_channel_uuid: this.event.metadata.req_channel_uuid,
      req_application_uuid: this.event.metadata.req_application_uuid,
      object: this.event.object,
      data: this.event.data,
      metadata: this.event.metadata
    }, {
      isNewRecord: true
    })
    // return userRole.destroy(this.options)
    return test.save(this.options)
      .then(_e => {
        console.log('BRK LOGGED!', _e)
        return [this.event, this.options]
      })
      .catch(err => {
        console.log('BRK LOGGED ERR!', err)
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

class Puff extends Project {
  async run() {
    return Promise.resolve([this.event, this.options])
  }
}

module.exports = class Test extends Projector {
  logger({event, options, consistency, message}) {
    return new Logger(this.app, event, options, consistency, message)
  }
  created({event, options, consistency, message}) {
    return new Created(this.app, event, options, consistency, message)
  }
  created2({event, options, consistency, message}) {
    return new Created(this.app, event, options, consistency, message)
  }
  updated({event, options, consistency, message}) {
    return new Updated(this.app, event, options, consistency, message)
  }
  puff({event, options, consistency, message}) {
    return new Puff(this.app, event, options, consistency, message)
  }
}
