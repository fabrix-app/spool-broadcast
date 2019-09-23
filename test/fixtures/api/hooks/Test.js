const HookIn = require('../../../../dist').HookIn
const Hook = require('../../../../dist').Hook

class Create extends Hook {
  async run() {

    return this.command.reload(this.options)
      .then(() => {

        // Log the creation time
        this.command.createdAt()
        this.command.updatedAt()

        // Log the changes to the command metadata
        this.command.changes()

        return [this.command, this.options]
      })
  }
  async cancel() {
    return Promise.resolve([this.command, this.options])
  }
}

module.exports = class Test extends HookIn {
  create({command, options, lifecycle}) {
    return new Create(this.app, command, options, lifecycle)
  }
}
