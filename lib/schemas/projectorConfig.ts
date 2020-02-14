import joi from '@hapi/joi'

export const projectorConfig = joi.object().keys({
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

  priority: joi.number(),

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

  processing: joi.string(),

  // Retry rules
  retry_on_fail: joi.boolean(),
  retry_on_timeout: joi.boolean(),
  retry_max: joi.number(),
  retry_wait: joi.number(),
}).unknown()
