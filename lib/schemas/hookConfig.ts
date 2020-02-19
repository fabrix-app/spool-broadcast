import joi from '@hapi/joi'

export const hookConfig = joi.object().keys({
  lifecycle: joi.string(),
  priority: joi.number(),

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

  // Retry rules
  retry_on_fail: joi.boolean(),
  retry_on_timeout: joi.boolean(),
  retry_max: joi.number(),
  retry_wait: joi.number(),

}).unknown()
