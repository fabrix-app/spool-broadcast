const Entry = require('../../../../dist').Entry

module.exports = class Test extends Entry {
  create(req, body, options) {
    return this.transaction(this.app.sagas.Test.create, req, body, options)
  }
  update(req, body, options) {
    return this.transaction(this.app.sagas.Test.update, req, body, options)
  }
  destroy(req, body, options) {
    return this.transaction(this.app.sagas.Test.destroy, req, body, options)
  }
}
