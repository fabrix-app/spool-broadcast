const BroadcastChannel = require('../../../../dist').BroadcastChannel
const BroadcastSubscriber = require('../../../../dist').BroadcastSubscriber


class Crud extends BroadcastSubscriber {
  async run() {
    console.log('NOTIFY RUNNING', this)
    return Promise.resolve(this)
  }
}

module.exports = class Test extends BroadcastChannel {
  created({event, options, broker, broadcaster}) {
    console.log('NOTIFIED', event, options)
    return new Crud(this.app, { channel: this, event, options, broker, broadcaster })
  }
  crud({event, options, broker, broadcaster}) {
    console.log('NOTIFIED', event, options)
    return new Crud(this.app, { channel: this, event, options, broker, broadcaster })
  }
}
