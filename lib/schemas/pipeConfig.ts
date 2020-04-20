import joi from '@hapi/joi'

export const pipeConfig = joi.object().keys({
  // lifecycle: joi.string(),
  // priority: joi.number(),
  fail_on_error: joi.boolean(),
  if: joi.func(),
  before: joi.func(),
  after: joi.func(),
  zip: joi.alternatives().try(
    joi.boolean(),
    joi.object()
  ),
  merge: joi.alternatives().try(
    joi.boolean(),
    joi.object()
  ),
}).unknown()
