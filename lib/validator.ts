import joi from 'joi'
import {
  broadcastConfig,
  realtimeConfig,
  hookConfig,
  processorConfig,
  projectorConfig,
  pipeConfig
} from './schemas'

export const Validator = {

  joiPromise: (data: any, schema: joi.ObjectSchema) => {
    return new Promise((resolve, reject) => {
      joi.validate(data, schema, (err, value) => {
        if (err) {
          return reject(err)
        }
        return resolve(value)
      })
    })
  },

  joiPromiseMap: (list: any, schema: joi.ObjectSchema) => {
    return Promise.all(list.map(data => {
      return new Promise((resolve, reject) => {
        joi.validate(data, schema, (err, value) => {
          if (err) {
            return reject(new TypeError(err))
          }
          return resolve(value)
        })
      })
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
