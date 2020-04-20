const Processor = require('../../../../dist').BroadcastProcessor
const Process = require('../../../../dist').BroadcastProcess


class Update extends Process {
  async run() {
    const test = this.event.data

    return this.app.entries.TestEntry2.update({
      ...this.metadata
    }, test, {parent: this.options})
  }
}

module.exports = class TestProcessor2 extends Processor {

  update({event, options, consistency, message, manager}) {
    return new Update(this.app, {event, options, consistency, message, manager})
  }
}
