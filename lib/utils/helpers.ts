import { isArray } from 'lodash'

import { lodash } from './lodash'

export const helpers = {

  // Entry to helpers
  handle: (previous, current, config) => {
    if (!isArray(previous) && isArray(current)) {
      return helpers.oneToMany(previous, current, config)
    }
    else if (!isArray(previous) && !isArray(current)) {
      return helpers.oneToOne(previous, current, config)
    }
    else if (isArray(previous) && isArray(current)) {
      return helpers.manyToMany(previous, current, config)
    }
    else if (isArray(previous) && !isArray(current)) {
      return helpers.manyToOne(previous, current, config)
    }
  },

  // Previous is a single object, and current is mutliple
  oneToMany: (previous, current, config = {}) => {
    const keys = Object.keys(config)
    keys.forEach(k => {
      const v = config[k]
    })
    return previous
  },

  // Previous is a single object, and current is a single object
  oneToOne: (previous, current, config = {}) => {
    const keys = Object.keys(config)
    keys.forEach(k => {
      const v = config[k]
    })
    return previous
  },

  // Previous is multiple objects, and current multiple objects
  manyToMany: (previous, current, config = {}) => {
    const keys = Object.keys(config)
    keys.forEach(k => {
      const v = config[k]
    })
    return previous
  },

  // Previous is multiple objects, and current is one
  manyToOne: (previous, current, config = {}) => {
    const keys = Object.keys(config)
    keys.forEach(k => {
      const v = config[k]
    })
    return previous
  }
}
