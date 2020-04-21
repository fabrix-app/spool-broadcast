const joi = require('@hapi/joi')
const Saga = require('../../../../dist').Saga
const Validator = require('../../../../dist').Validator

const validate = {
  'create.test': (data) => Validator.joiPromise(data, joi.object()),
  'update.test': (data) => Validator.joiPromise(data, joi.object())
}

module.exports = class Test extends Saga {

  create(req, body, options) {
    const TestBroadcast = this.app.broadcasts.TestBroadcast2

    // Build a permission instance
    body = this.app.models.Test.stage(body, {
      isNewRecord: true,
      configure: ['generateUUID'],
      before: [function(d, opts) {
        return d
      }],
      after: [function(d, opts) {
        return d
      }]
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


  update(req, body, options) {
    const TestBroadcast = this.app.broadcasts.TestBroadcast2

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
}
