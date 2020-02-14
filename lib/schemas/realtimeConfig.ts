import joi from '@hapi/joi'

export const realtimeConfig = joi.object().keys({
  // The required plugins for broadcast to work
  plugins: joi.object().keys({
    // 'multiplex': joi.any(),
    // 'emitter': joi.any()
    'rooms': joi.any()
  }).unknown()
}).unknown()
