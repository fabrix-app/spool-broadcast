const BroadcastChannel = require('../../../../dist').BroadcastChannel
const BroadcastSubscriber = require('../../../../dist').BroadcastSubscriber


class Crud extends BroadcastSubscriber {
  async run() {
    console.log('NOTIFY RUNNING', this)
    return Promise.resolve(this)
  }
}

module.exports = class Test extends BroadcastChannel {
  created({event, options, broker}) {
    console.log('NOTIFIED', event, options)
    return new Crud(this.app, this, event, options, broker)
  }
  crud({event, options, broker}) {
    console.log('NOTIFIED', event, options)
    return new Crud(this.app, this, event, options, broker)
  }
}
