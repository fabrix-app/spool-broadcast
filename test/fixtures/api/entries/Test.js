const Entry = require('../../../../dist').Entry

module.exports = class Test extends Entry {
  create(req, body, options) {
    return this.transaction(this.app.sagas.Test.create, req, body, options)
  }
}
