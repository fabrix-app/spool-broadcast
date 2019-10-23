import joi from 'joi'

export const subscriberConfig = joi.object().keys({
  lifespan: joi.string(),
  priority: joi.number(),
}).unknown()
