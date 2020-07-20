const Projector = require('../../../../dist').BroadcastProjector
const Project = require('../../../../dist').BroadcastProject


class Wild extends Project {
  async run() {


    const project = this.broadcaster.buildProjection({
      event: this.event,
      object: this.app.models.Test,
      data: this.event.data,
      options: this.options
    })

    console.log('BRK WILDCARD!', this.event, project)

    console.log('BRK explain', this.event.explain)

    return Promise.resolve([{action: false}, this.options])
  }
}

class Logger extends Project {
  async run() {
    console.log('BRK LOGGED!', this.event)

    this.projectorModel = this.app.models.TestLogger

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
    console.log('BRK LOGGER SAVE OPTIONS', this.saveOptions)
    // return userRole.destroy(this.options)
    return test.save(this.options)
      .then(_e => {
        const project = this.broadcaster.buildProjection({
          event: this.event,
          object: this.app.models.TestLogger,
          data: _e.toJSON(),
          options: this.options
        })
        console.log('BRK LOGGED Result!', _e, project)
        return [project, this.options]
        // return [this.event, this.options]
      })
  }
}

class FailLogger extends Project {
  async run() {
    console.log('BRK FAIL LOGGED!', this.event)

    const err = new Error('Testing Failing')
    return Promise.reject(err)
  }
}

class Created extends Project {
  async run() {
    const test = this.event.object.stage(this.event.data, { isNewRecord: true })
    // return test.save({ fields: this.event.changes(), ...this.options})
    return test.save(this.saveOptions)
      .then(_e => {
        return [this.event, this.options]
      })
  }
}
class Updated extends Project {
  async run() {
    const test = this.event.object.stage(this.event.data, { isNewRecord: false })
    //
    // return test.save({ fields: this.event.changes(), ...this.options})
    return test.save(this.saveOptions)
      .then(_e => {
        return [this.event, this.options]
      })
  }
}

class Puff extends Project {
  async run() {
    return Promise.resolve([this.event, this.options])
  }
}

module.exports = class Test extends Projector {
  // wild({event, options, consistency, message, manager, broadcaster}) {
  //   return new Wild(this.app, {event, options, consistency, message, manager, broadcaster})
  // }
  // Test Shorthand
  wild(args) {
    return this.newProjector(Wild, args)
  }
  logger({event, options, consistency, message, manager, broadcaster}) {
    return new Logger(this.app, {event, options, consistency, message, manager, broadcaster})
  }
  failLogger({event, options, consistency, message, manager}) {
    return new FailLogger(this.app, {event, options, consistency, message, manager})
  }
  created({event, options, consistency, message, manager}) {
    return new Created(this.app, {event, options, consistency, message, manager})
  }
  created2({event, options, consistency, message, manager}) {
    return new Created(this.app, {event, options, consistency, message, manager})
  }
  updated({event, options, consistency, message, manager}) {
    return new Updated(this.app, {event, options, consistency, message, manager})
  }
  puff({event, options, consistency, message, manager}) {
    return new Puff(this.app, {event, options, consistency, message, manager})
  }
}
