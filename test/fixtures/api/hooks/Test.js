const HookIn = require('../../../../dist').BroadcastHookIn
const Hook = require('../../../../dist').BroadcastHook
const assert = require('assert')

class Create extends Hook {
  async run() {

    assert.equal(this.command.data.isStaged, true)
    // assert.equal(this.command.data.isNewRecord, true)
    // assert.equal(this.command.data.isReloaded, false)

    return this.command.reload(this.options)
      .then(() => {

        assert.equal(this.command.data.isStaged, true)
        // assert.equal(this.command.data.isNewRecord, true)
        assert.equal(this.command.data.isReloaded, true)

        // Log the creation time
        this.command.createdAt()
        this.command.updatedAt()

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

    console.log(
      'brk test changes before',
      this.command.data._options,
      this.command.data,
      this.command.data_applied,
      this.command.data_updates,
      this.command.data_previous,
      this.command.data_changed
    )

    assert.equal(this.command.data.isNewRecord, false)
    assert.equal(this.command.data.isStaged, true)

    return this.command.reload(this.options)
      .then(() => {

        assert.equal(this.command.data.isNewRecord, false)
        assert.equal(this.command.data.isStaged, true)
        assert.equal(this.command.data.isReloaded, true)

        console.log(
          'brk test changes during',
          this.command.data._options,
          this.command.data,
          this.command.data_applied,
          this.command.data_updates,
          this.command.data_previous,
          this.command.data_changed
        )

        this.command.approveUpdates(approvedUpdates)

        this.command.apply('test', 'testing 1234')

        // Log the updated time
        this.command.updatedAt()

        console.log(
          'brk test changes after',
          this.command.data._options,
          this.command.data,
          this.command.data_applied,
          this.command.data_updates,
          this.command.data_previous,
          this.command.data_changed
        )
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
