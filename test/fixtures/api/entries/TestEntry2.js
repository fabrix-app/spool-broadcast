const { Entry, Point, Action, Command } = require('../../../../dist')

module.exports = class TestEntry2 extends Entry {
  // @Point({})
  // @Command({})
  create(req, body, options) {
    return this.transaction(this.app.sagas.TestSaga2.create, req, body, options)
  }

  // @Point({})
  // @Command({})
  update(req, body, options) {
    return this.transaction(this.app.sagas.TestSaga2.update, req, body, options)
  }
}
