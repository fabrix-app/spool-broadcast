const BroadcastChannel = require('../../../../dist').BroadcastChannel
const BroadcastSubscriber = require('../../../../dist').BroadcastSubscriber


class Crud2 extends BroadcastSubscriber {
  async run() {
    console.log('NOTIFY RUNNING', this)
    return Promise.resolve(this)
  }
}

module.exports = class Test2 extends BroadcastChannel {
  created2({event, options, broker, broadcaster}) {
    console.log('NOTIFIED', event, options)
    return new Crud2(this.app, {channel: this, event, options, broker, broadcaster})
  }

  crud2({event, options, broker, broadcaster}) {
    console.log('NOTIFIED', event, options)
    return new Crud2(this.app, {channel: this, event, options, broker, broadcaster})
  }
}
