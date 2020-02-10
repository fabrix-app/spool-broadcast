const joi = require('joi')
const Saga = require('../../../../dist').Saga
const Validator = require('../../../../dist').Validator

const validate = {
  'create.test': (data) => Validator.joiPromise(data, joi.object()),
  'test.eventual': (data) => Validator.joiPromise(data, joi.object()),
  'test.eventual.processor': (data) => Validator.joiPromise(data, joi.object()),
  'create.test.list': (data) => Validator.joiPromiseMap(data, joi.object()),
  'create.:test_uuid.test': (data) => Validator.joiPromise(data, joi.object()),
  'create.test.:test_uuid.test.:test_uuid': (data) => Validator.joiPromise(data, joi.object()),
  'update.test': (data) => Validator.joiPromise(data, joi.object()),
  'destroy.test': (data) => Validator.joiPromise(data, joi.object())
}

module.exports = class Test extends Saga {

  create(req, body, options) {
    const TestBroadcast = this.app.broadcasts.Test

    // Build a permission instance
    body = this.app.models.Test.stage(body, {
      isNewRecord: true,
      configure: ['generateUUID']
    })

    const command = TestBroadcast.createCommand({
      req: req,
      command_type: 'create.test',
      object: this.app.models.Test,
      data: body,
      causation_uuid: req.causation_uuid,
      correlation_uuid: req.correlation_uuid,
      metadata: {}
    })

    return this.before(command, validate, options)
      .then(([_command, _options]) => {
        const event = TestBroadcast.buildEvent({
          event_type: 'test.created',
          correlation_uuid: _command.command_uuid,
          command: _command
        })

        return TestBroadcast.broadcast(event, _options)
      })
  }

  createEventual(req, body, options) {
    const TestBroadcast = this.app.broadcasts.Test

    // Build a permission instance
    body = this.app.models.Test.stage(body, {
      isNewRecord: true,
      configure: ['generateUUID']
    })

    const command = TestBroadcast.createCommand({
      req: req,
      command_type: 'test.eventual',
      object: this.app.models.Test,
      data: body,
      causation_uuid: req.causation_uuid,
      correlation_uuid: req.correlation_uuid,
      metadata: {}
    })

    return this.before(command, validate, options)
      .then(([_command, _options]) => {
        const event = TestBroadcast.buildEvent({
          event_type: 'eventual.tested',
          correlation_uuid: _command.command_uuid,
          command: _command
        })

        return TestBroadcast.broadcast(event, _options)
      })
  }

  createEventualProcessor(req, body, options) {
    const TestBroadcast = this.app.broadcasts.Test

    // Build a permission instance
    body = this.app.models.Test.stage(body, {
      isNewRecord: true,
      configure: ['generateUUID']
    })

    const command = TestBroadcast.createCommand({
      req: req,
      command_type: 'test.eventual.processor',
      object: this.app.models.Test,
      data: body,
      causation_uuid: req.causation_uuid,
      correlation_uuid: req.correlation_uuid,
      metadata: {}
    })

    return this.before(command, validate, options)
      .then(([_command, _options]) => {
        const event = TestBroadcast.buildEvent({
          event_type: 'eventual.processor.tested',
          correlation_uuid: _command.command_uuid,
          command: _command
        })

        return TestBroadcast.broadcast(event, _options)
      })
  }

  bulkCreate(req, body, options) {
    const TestBroadcast = this.app.broadcasts.Test

    // Build a permission instance
    body = this.app.models.Test.stage(body, {
      isNewRecord: true,
      configure: ['generateUUID']
    })

    const command = TestBroadcast.createCommand({
      req: req,
      command_type: 'create.test.list',
      object: this.app.models.Test,
      data: body,
      causation_uuid: req.causation_uuid,
      correlation_uuid: req.correlation_uuid,
      metadata: {}
    })

    return this.before(command, validate, options)
      .then(([_command, _options]) => {
        const event = TestBroadcast.buildEvent({
          event_type: 'test.created.list',
          correlation_uuid: _command.command_uuid,
          command: _command
        })

        return TestBroadcast.broadcast(event, _options)
      })
  }


  createWithParams(req, body, options) {
    const TestBroadcast = this.app.broadcasts.Test

    // Build a permission instance
    body = this.app.models.Test.stage(body, {
      isNewRecord: true,
      configure: ['generateUUID']
    })

    const command = TestBroadcast.createCommand({
      req: req,
      command_type: 'create.:test_uuid.test',
      object: this.app.models.Test,
      data: body,
      causation_uuid: req.causation_uuid,
      correlation_uuid: req.correlation_uuid,
      metadata: {}
    })

    return this.before(command, validate, options)
      .then(([_command, _options]) => {
        const event = TestBroadcast.buildEvent({
          event_type: 'test.:test_uuid.created',
          correlation_uuid: _command.command_uuid,
          command: _command
        })

        return TestBroadcast.broadcast(event, _options)
      })
  }

  createWithDoubleParams(req, body, options) {
    const TestBroadcast = this.app.broadcasts.Test

    // Build a permission instance
    body = this.app.models.Test.stage(body, {
      isNewRecord: true,
      configure: ['generateUUID']
    })

    const command = TestBroadcast.createCommand({
      req: req,
      command_type: 'create.test.:test_uuid.test.:test_uuid',
      object: this.app.models.Test,
      data: body,
      causation_uuid: req.causation_uuid,
      correlation_uuid: req.correlation_uuid,
      metadata: {
        prehooks: [
          [1, {
            command_type: 'create.test.:test_uuid.test.:test_uuid',
            priority: 1,
            prehook_url: 'TestController.authorize',
            prehook_method: 'POST'
          }]
        ]
      }
    })

    return this.before(command, validate, options)
      .then(([_command, _options]) => {
        const event = TestBroadcast.buildEvent({
          event_type: 'test.:test_uuid.test.:test_uuid.created',
          correlation_uuid: _command.command_uuid,
          command: _command
        })

        return TestBroadcast.broadcast(event, _options)
      })
  }


  update(req, body, options) {
    const TestBroadcast = this.app.broadcasts.Test

    // Build a permission instance
    body = this.app.models.Test.stage(body, {
      isNewRecord: false
    })

    const command = TestBroadcast.createCommand({
      req: req,
      command_type: 'update.test',
      object: this.app.models.Test,
      data: body,
      causation_uuid: req.causation_uuid,
      correlation_uuid: req.correlation_uuid,
      metadata: {}
    })

    return this.before(command, validate, options)
      .then(([_command, _options]) => {
        const event = TestBroadcast.buildEvent({
          event_type: 'test.updated',
          correlation_uuid: _command.command_uuid,
          command: _command
        })

        return TestBroadcast.broadcast(event, _options)
      })
  }

  destroy(req, body, options) {
    const TestBroadcast = this.app.broadcasts.Test

    // Build a permission instance
    body = this.app.models.Test.stage(body, {isNewRecord: true})

    const command = TestBroadcast.createCommand({
      req: req,
      command_type: 'destroy.test',
      object: this.app.models.Test,
      data: body,
      causation_uuid: req.causation_uuid,
      correlation_uuid: req.correlation_uuid,
      metadata: {}
    })

    return this.before(command, validate, options)
      .then(([_command, _options]) => {
        const event = TestBroadcast.buildEvent({
          event_type: 'test.destroyed',
          correlation_uuid: _command.command_uuid,
          command: _command
        })

        return TestBroadcast.broadcast(event, _options)
      })
  }
}
