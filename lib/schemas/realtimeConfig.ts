import joi from 'joi'

export const realtimeConfig = joi.object().keys({
  // The required plugins for broadcast to work
  plugins: joi.object().keys({
    'multiplex': joi.any(),
    'emitter': joi.any()
  }).unknown()
}).unknown()
