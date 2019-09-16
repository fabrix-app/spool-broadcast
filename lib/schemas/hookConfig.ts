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
}).unknown()
