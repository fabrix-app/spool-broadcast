const BroadcastChannel = require('../../../../dist').BroadcastChannel
const BroadcastSubscriber = require('../../../../dist').BroadcastSubscriber


class Created extends BroadcastSubscriber {
  async run() {
    console.log('NOTIFY RUNNING', this)
    return Promise.resolve([])
  }
}

module.exports = class Test extends BroadcastChannel {
  created({event, options, broker}) {
    console.log('NOTIFIED', event, options)
    return new Created(this.app, event, options, broker)
  }
  crud({event, options, broker}) {
    console.log('NOTIFIED', event, options)
    return new Created(this.app, event, options, broker)
  }
}
