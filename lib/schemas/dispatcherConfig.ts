import joi from '@hapi/joi'

export const dispatcherConfig = joi.object().keys({
  consistency: joi.string(),
  priority: joi.number(),
  versions: joi.alternatives().try(
    joi.number(),
    joi.array().items(joi.number())
  ),
  type: joi.string(),


  // TODO, deprecate these into data and metadata
  include: joi.alternatives().try(
    joi.boolean(),
    joi.object()
  ),
  merge: joi.alternatives().try(
    joi.boolean(),
    joi.object()
  ),

  data: joi.object(),
  metadata: joi.object(),
  options: joi.object(),

  // The type of Object coming in
  expects_input: joi.alternatives().try(
    joi.string(),
    joi.array().items(joi.string())
  ),
  // The type of Object coming out
  expects_output: joi.alternatives().try(
    joi.string(),
    joi.array().items(joi.string())
  ),

  // The command string that is dispatched by this dispatcher
  dispatches_command: joi.string(),

  // The type of Object coming back from dispatcher
  expects_response: joi.alternatives().try(
    joi.string(),
    joi.array().items(joi.string())
  ),

  processing: joi.string(),

  // Retry rules
  retry_on_fail: joi.boolean(),
  retry_on_timeout: joi.boolean(),
  retry_max: joi.number(),
  retry_wait: joi.number(),
}).unknown()
