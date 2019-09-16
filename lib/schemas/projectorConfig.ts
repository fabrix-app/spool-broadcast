import joi from 'joi'

export const projectorConfig = joi.object().keys({
  include: joi.alternatives().try(
    joi.boolean(),
    joi.object()
  ),
  merge: joi.alternatives().try(
    joi.boolean(),
    joi.object()
  ),
  priority: joi.number(),
  expects: joi.alternatives().try(
    joi.string(),
    joi.array().items(joi.string())
  ),
  processing: joi.string(),
  retry: joi.number()
}).unknown()
