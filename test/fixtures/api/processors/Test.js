const Processor = require('../../../../dist').BroadcastProcessor
const Process = require('../../../../dist').BroadcastProcess


class Update extends Process {
  async run() {
    const test = this.event.data

    return this.app.entries.Test.update({
      ...this.metadata
    }, test, { parent: this.options })
  }
}

class Destroy extends Process {
  async run() {
    const test = this.event.data

    return this.app.entries.Test.destroy({
      ...this.metadata
    }, test, { parent: this.options })
  }
}

class Eventual extends Process {
  async run() {
    const test = this.event.data

    console.log('BRK EVENTUAL PROCESSOR', this.event.data, this.manager)

    return this.app.entries.Test.createEventualProcessor({
      ...this.metadata
    }, test, {parent: this.options})
  }
}

module.exports = class Test extends Processor {

  eventual({event, options, consistency, message, manager}) {
    return new Eventual(this.app, event, options, consistency, message, manager)
  }

  update({event, options, consistency, message, manager}) {
    return new Update(this.app, event, options, consistency, message, manager)
  }

  destroy({event, options, consistency, message, manager}) {
    return new Destroy(this.app, event, options, consistency, message, manager)
  }
}
