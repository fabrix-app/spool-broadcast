import joi from 'joi'

export const processorConfig = joi.object().keys({
  consistency: joi.string(),
  priority: joi.number(),
  versions: joi.alternatives().try(
    joi.number(),
    joi.array().items(joi.number())
  ),
  is_processor: joi.boolean(),

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

  // The command string that is dispatched by this processor
  dispatches_command: joi.string(),

  // The type of Object coming back from processor
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
