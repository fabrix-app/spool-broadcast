import joi from 'joi'

export const hookConfig = joi.object().keys({
  lifecycle: joi.string(),
  priority: joi.number(),
  include: joi.alternatives().try(
    joi.boolean(),
    joi.object()
  ),
  merge: joi.alternatives().try(
    joi.boolean(),
    joi.object()
  ),

  // Retry rules
  retry_on_fail: joi.boolean(),
  retry_on_timeout: joi.boolean(),
  retry_max: joi.number(),
  retry_wait: joi.number(),

}).unknown()
