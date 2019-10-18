const Processor = require('../../../../dist').Processor
const Process = require('../../../../dist').Process


class Update extends Process {
  async run() {
    const test = this.event.data

    return this.app.entries.Test.update({
      ...this.metadata
    }, test, {parent: this.options})
      .then(([_e, _o]) => [_e, _o])
      .catch((err) => {
        if (this.consistency === 'eventual') {
          return Promise.reject(err)
        }
        else {
          return [{ action: 'retry'}, this.options]
        }
      })
  }
}

class Destroy extends Process {
  async run() {
    const test = this.event.data

    return this.app.entries.Test.destroy({
      ...this.metadata
    }, test, {parent: this.options})
      .then(([_e, _o]) => [_e, _o])
      .catch((err) => {
        if (this.consistency === 'eventual') {
          return Promise.reject(err)
        }
        else {
          return [{ action: 'retry'}, this.options]
        }
      })
  }
}

module.exports = class Test extends Processor {

  update({event, options}) {
    return new Update(this.app, event, options)
  }

  destroy({event, options}) {
    return new Destroy(this.app, event, options)
  }
}
