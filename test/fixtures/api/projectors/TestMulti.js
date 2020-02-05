const Projector = require('../../../../dist').BroadcastProjector
const Project = require('../../../../dist').BroadcastProject


class One extends Project {
  async run() {
    console.log('BRK One!', this.manager)
    const test = this.app.models.TestEventual.stage({
      event_type: this.event.event_type,
      consistency: this.manager.consistency,
      count: 1
    }, {
      isNewRecord: true
    })
    // return userRole.destroy(this.options)
    return test.save(this.options)
      .then(_e => {
        console.log('BRK LOGGED Result!', _e)
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
class Two extends Project {
  async run() {
    console.log('BRK Two!', this.manager)
    const test = this.app.models.TestEventual.stage({
      event_type: this.event.event_type,
      consistency: this.manager.consistency,
      count: 2
    }, {
      isNewRecord: true
    })
    // return userRole.destroy(this.options)
    return test.save(this.options)
      .then(_e => {
        console.log('BRK LOGGED Result!', _e)
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
class Three extends Project {
  async run() {
    console.log('BRK Three!', this.manager)
    const test = this.app.models.TestEventual.stage({
      event_type: this.event.event_type,
      consistency: this.manager.consistency,
      count: 3
    }, {
      isNewRecord: true
    })
    // return userRole.destroy(this.options)
    return test.save(this.options)
      .then(_e => {
        console.log('BRK LOGGED Result!', _e)
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

module.exports = class TestMulti extends Projector {
  one({event, options, consistency, message, manager}) {
    return new One(this.app, event, options, consistency, message, manager)
  }
  two({event, options, consistency, message, manager}) {
    return new Two(this.app, event, options, consistency, message, manager)
  }
  three({event, options, consistency, message, manager}) {
    return new Three(this.app, event, options, consistency, message, manager)
  }
}
