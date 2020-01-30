const { Entry, Point, Action, Command } = require('../../../../dist')

module.exports = class Test extends Entry {
  // @Point({})
  // @Command({})
  create(req, body, options) {
    return this.transaction(this.app.sagas.Test.create, req, body, options)
  }

  // @Point({})
  // @Command({})
  bulkCreate(req, body, options) {
    return this.transaction(this.app.sagas.Test.bulkCreate, req, body, options)
  }

  // @Point({})
  // @Command({})
  createWithParams(req, body, options) {
    return this.transaction(this.app.sagas.Test.createWithParams, req, body, options)
  }

  // @Point({})
  // @Command({})
  createWithDoubleParams(req, body, options) {
    return this.transaction(this.app.sagas.Test.createWithDoubleParams, req, body, options)
  }

  // @Point({})
  // @Command({})
  update(req, body, options) {
    return this.transaction(this.app.sagas.Test.update, req, body, options)
  }

  // @Point({})
  // @Command({})
  destroy(req, body, options) {
    return this.transaction(this.app.sagas.Test.destroy, req, body, options)
  }

  // @Point({})
  // @Action({})
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
