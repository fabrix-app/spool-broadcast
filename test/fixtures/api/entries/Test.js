const Entry = require('../../../../dist').Entry

module.exports = class Test extends Entry {
  create(req, body, options) {
    return this.transaction(this.app.sagas.Test.create, req, body, options)
  }
  createWithParams(req, body, options) {
    return this.transaction(this.app.sagas.Test.createWithParams, req, body, options)
  }
  createWithDoubleParams(req, body, options) {
    return this.transaction(this.app.sagas.Test.createWithDoubleParams, req, body, options)
  }
  update(req, body, options) {
    return this.transaction(this.app.sagas.Test.update, req, body, options)
  }
  destroy(req, body, options) {
    return this.transaction(this.app.sagas.Test.destroy, req, body, options)
  }

  findByPk(req, body, options) {
    return this.app.models.Test.findOne({
      ...body.query,
      where: {
        test_uuid: body.params.test_uuid
      },
    })
      .then(res => {
        return [{
            action: 'test.get',
            object: this.app.models.Test,
            data: res
          }, options]
      })
  }
}
