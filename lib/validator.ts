import joi from 'joi'
import {broadcastConfig, hookConfig, processorConfig, projectorConfig, pipeConfig} from './schemas'

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
    return new Promise((resolve, reject) => {
      joi.validate(config, broadcastConfig, (err, value) => {
        if (err) {
          return reject(new TypeError('config.broadcast: ' + err))
        }
        return resolve(value)
      })
    })
  },
  validateProjectorConfig (config) {
    return new Promise((resolve, reject) => {
      joi.validate(config, projectorConfig, (err, value) => {
        if (err) {
          return reject(new TypeError('projector.config: ' + err))
        }
        return resolve(value)
      })
    })
  },
  validateProcessorConfig (config) {
    return new Promise((resolve, reject) => {
      joi.validate(config, processorConfig, (err, value) => {
        if (err) {
          return reject(new TypeError('projector.config: ' + err))
        }
        return resolve(value)
      })
    })
  },
  validateHookConfig (config) {
    return new Promise((resolve, reject) => {
      joi.validate(config, hookConfig, (err, value) => {
        if (err) {
          return reject(new TypeError('hook.config: ' + err))
        }
        return resolve(value)
      })
    })
  },
  validatePipeConfig (config) {
    return new Promise((resolve, reject) => {
      joi.validate(config, pipeConfig, (err, value) => {
        if (err) {
          return reject(new TypeError('pipe.config: ' + err))
        }
        return resolve(value)
      })
    })
  }
}
