import joi from 'joi'

export const processorConfig = joi.object().keys({
  consistency: joi.string(),
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
  priority: joi.number(),
  expects: joi.alternatives().try(
    joi.string(),
    joi.array().items(joi.string())
  ),
  dispatches: joi.string(),
  processing: joi.string(),
  retry: joi.number()
}).unknown()
