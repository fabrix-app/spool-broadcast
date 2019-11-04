const BroadcastChannel = require('../../../../dist').BroadcastChannel
const BroadcastSubscriber = require('../../../../dist').BroadcastSubscriber


class Crud2 extends BroadcastSubscriber {
  async run() {
    console.log('NOTIFY RUNNING', this)
    return Promise.resolve(this)
  }
}

module.exports = class Test2 extends BroadcastChannel {
  created2({event, options, broker}) {
    console.log('NOTIFIED', event, options)
    return new Crud2(this.app, this, event, options, broker)
  }
  crud2({event, options, broker}) {
    console.log('NOTIFIED', event, options)
    return new Crud2(this.app, this, event, options, broker)
  }
}
