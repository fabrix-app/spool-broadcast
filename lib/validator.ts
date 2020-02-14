import Joi from '@hapi/joi'
import {
  broadcastConfig,
  realtimeConfig,
  hookConfig,
  processorConfig,
  projectorConfig,
  pipeConfig
} from './schemas'

export const Validator = {

  /**
   * Validate an object given a schema
   * @param data
   * @param schema
   */
  joiPromise: (data: any, schema: Joi.ObjectSchema): Promise<any> => {
    return schema.validateAsync(data)
  },

  /**
   * Given an array, and a Schema, validate each item in the array with the same schema
   * @param list
   * @param schema
   */
  joiPromiseMap: (list: any[], schema: Joi.ObjectSchema): Promise<any> => {
    return Promise.all(list.map(data => {
      return Validator.joiPromise(data, schema)
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
