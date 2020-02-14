import joi from '@hapi/joi'

export const subscriberConfig = joi.object().keys({
  lifespan: joi.string(),
  priority: joi.number(),
}).unknown()
