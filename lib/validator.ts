import joi from '@hapi/joi'

import {
  broadcastConfig,
  realtimeConfig,
  hookConfig,
  processorConfig,
  projectorConfig,
  pipeConfig
} from './schemas'

export const Validator = {

  // This handles multiple versions of joi
  joiPromise: (data: any, schema: joi.ObjectSchema, options = {}) => {
    return new Promise((resolve, reject) => {
      if (schema.validate) {

        const { value, error } = schema.validate(data, options)
        if (error) {
          return reject(error)
        }
        return resolve(value)
      }
      else {
        joi.validate(data, schema, options, (err, value) => {
          if (err) {
            return reject(err)
          }
          return resolve(value)
        })
      }
    })
  },

  joiPromiseMap: (list: any, schema: joi.ObjectSchema, options?) => {
    return Promise.all(list.map(data => {
      return Validator.joiPromise(data, schema, options)
    }))
  },

  // Validate Broadcast Config
  validateBroadcastConfig (config) {
    return Validator.joiPromise(config, broadcastConfig)
  },

  // Validate Broadcast Config
  validateRealtimeConfig (config) {
    return Validator.joiPromise(config, realtimeConfig)
  },

  validateProjectorConfig (config) {
    return Validator.joiPromise(config, projectorConfig)
  },

  validateProcessorConfig (config) {
    return Validator.joiPromise(config, processorConfig)
  },

  validateHookConfig (config) {
    return Validator.joiPromise(config, hookConfig)
  },

  validatePipeConfig (config) {
    return Validator.joiPromise(config, pipeConfig)
  }
}
