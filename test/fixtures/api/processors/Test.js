const Processor = require('../../../../dist').BroadcastProcessor
const Process = require('../../../../dist').BroadcastProcess


class Update extends Process {
  async run() {
    const test = this.event.data

    return this.app.entries.Test.update({
      ...this.metadata
    }, test, {
      parent: this.options
    })
  }
}

class BulkUpdate extends Process {
  async run() {
    const test = this.event.data

    return this.app.entries.Test.bulkUpdate({
      ...this.metadata
    }, test, {
      parent: this.options
    })
  }
}

class Destroy extends Process {
  async run() {
    const test = this.event.data

    return this.app.entries.Test.destroy({
      ...this.metadata
    }, test, {
      parent: this.options
    })
  }
}

class Eventual extends Process {
  async run() {
    const test = this.event.data

    console.log('BRK EVENTUAL PROCESSOR', this.event.data, this.manager)

    return this.app.entries.Test.createEventualProcessor({
      ...this.metadata
    }, test, {
      parent: this.options
    })
  }
}


class CreateMany extends Process {
  async run() {
    const test = [
      this.event.data,
      this.event.data
    ]

    return this.app.spools.sequelize._datastore.Promise.mapSeries(test, (a, i) => {
      a.name = a.name + i

      return this.app.entries.Test.create({
        ...this.metadata
      }, a, {parent: this.options})
    })
      .then(results => {
        return [results.map(e => e[0]), results.map(e => e[1])]
      })
  }
}

class BulkAside extends Process {
  async run() {
    const test = this.event.data

    return this.app.spools.sequelize._datastore.Promise.mapSeries(test, (a, i) => {
      a.name = a.name + i

      return this.app.entries.Test.create({
        ...this.metadata
      }, a, {parent: this.options})
    })
      .then(results => {
        return [results.map(e => e[0]), results.map(e => e[1])]
      })
  }
}

module.exports = class Test extends Processor {

  eventual({event, options, consistency, message, manager}) {
    return new Eventual(this.app, event, options, consistency, message, manager)
  }
  // eventual(args) {
  //   return this.newProcessor(Eventual, args)
  // }

  update({event, options, consistency, message, manager}) {
    return new Update(this.app, event, options, consistency, message, manager)
  }

  bulkUpdate({event, options, consistency, message, manager}) {
    return new BulkUpdate(this.app, event, options, consistency, message, manager)
  }

  destroy({event, options, consistency, message, manager}) {
    return new Destroy(this.app, event, options, consistency, message, manager)
  }

  createMany({event, options, consistency, message, manager}) {
    return new CreateMany(this.app, event, options, consistency, message, manager)
  }

  bulkAside({event, options, consistency, message, manager}) {
    return new BulkAside(this.app, event, options, consistency, message, manager)
  }
}
