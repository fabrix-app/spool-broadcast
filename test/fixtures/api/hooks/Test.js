const HookIn = require('../../../../dist').BroadcastHookIn
const Hook = require('../../../../dist').BroadcastHook

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

class Update extends Hook {
  async run() {

    const approvedUpdates = ['name']
    return this.command.reload(this.options)
      .then(() => {

        this.command.approveUpdates(approvedUpdates)

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
  create({command, options, lifecycle, handler}) {
    return new Create(this.app, command, options, lifecycle, handler)
  }
  update({command, options, lifecycle, handler}) {
    return new Update(this.app, command, options, lifecycle, handler)
  }
}
