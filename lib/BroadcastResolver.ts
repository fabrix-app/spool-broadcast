import {FabrixModel, FabrixModel as Model} from '@fabrix/fabrix/dist/common'
import { SequelizeResolver } from '@fabrix/spool-sequelize'
import { isArray, defaultsDeep } from 'lodash'
import uuid from 'uuid/v4'

import { Type } from './binary/index'
import { utils } from './utils/index'

export class BroadcastResolver extends SequelizeResolver {
  get object() {
    return this.model ? this.model.constructor.name : this.constructor.name
  }
  toJSON() {
    // For whatever reason, Express occasionally calls this on the class wrongly.
    return this.object
  }
  generateUUID(options: {[key: string]: any} = {}) {
    return uuid()
  }

  primaryKeys(data: {[key: string]: any}): string[] {
    const keys = new Map()

    // console.log('BRK primary', this.sequelizeModel.primaryKeyAttributes)

    this.sequelizeModel.primaryKeyAttributes.forEach(k => {
      // if (this.schema[k].primaryKey) {
        keys.set(data[k], k)
      // }
    })
    return [...keys.keys()]
  }

  binaryDataSchema(object?: string) {
    const types = {}
    const allowedTypes = ['int', 'string', 'boolean', 'json', '{array}', '{}', 'float', 'unit', 'Buffer', 'oid', 'regex', 'date']

    // Handle Defined Fields
    Object.keys(this.schema).forEach(k => {
      // If this is not a fully ignored field
      if (this.schema[k].binaryInclude !== false) {
        // If the binary type id defined
        if (
          this.schema[k].binaryType
        ) {
          const key = `${k}${this.schema[k].binaryOptional ? '?' : ''}`
          return types[key] = this.schema[k].binaryType
        }
        // If the binary is not defined, but is optional attempt to translate
        else if (this.schema[k].binaryOptional) {
          const key = `${k}${this.schema[k].binaryOptional ? '?' : ''}`
          return types[key] = utils.replaceDataType(this.app, this.schema[k].type)
        }
        // Attempt a translation
        else {
          const key = `${k}${this.schema[k].primaryKey ? '' : '?'}`
          return types[key] = utils.replaceDataType(this.app, this.schema[k].type)
        }

        if (allowedTypes.indexOf(this.schema[k].binaryType) === -1) {
          throw new Error(`Expected binaryType ${allowedTypes}, got ${this.schema[k].binaryType}`)
        }
      }
    })

    // console.log(this.sequelizeModel.attributes)

    // Handle Associations
    Object.keys(this.sequelizeModel.associations || {}).forEach(k => {
      types[`${k}?`] = 'json'
    })

    // Handle object or array of data based on object name
    if (object && typeof object === 'string' && object.includes('.list')) {
      // console.log('BRK received array')
      try {
        return new Type([types])
      }
      catch (err) {
        this.app.log.error(object, 'type definition failed', err)
        throw new Error(err)
      }
    }
    else {
      try {
        return new Type(types)
      }
      catch (err) {
        this.app.log.error(object, 'type definition failed', err)
        throw new Error(err)
      }
    }
  }

  binaryMetadataSchema(object?, types?: {[key: string]: any}) {
    return new Type({
      // ...types,
      // Specific to RiSE
      'req_user_uuid?': 'string',
      'req_channel_uuid?': 'string',
      'req_application_uuid?': 'string',
      // 'req_device_uuid?:': 'string',
      // 'req_session_uuid?': 'string',

      // Broadcast Metadata types
      'hooks?': ['json'],
      'changes?': 'json',
      'previous?': 'json',
      'annotations?': 'json'
    })
  }

  toPlain(resp): {[key: string]: any} {
    Object.keys(resp).forEach(k => {
      if (resp.hasOwnProperty(k) && resp[k]) {
        if (isArray(resp[k])) {
          resp[k] = resp[k].map(_c => {
            if (_c && _c.toPlain && typeof _c.toPlain === 'function') {
              _c = _c.toPlain({plain: true})
            }
            return _c
          })
        }
        else if (typeof resp[k].toPlain === 'function') {
          resp[k] = resp[k].toPlain({plain: true})
        }
      }
    })
    return resp
  }

  toBinaryData (data, object?) {
    if (Buffer.isBuffer(data)) {
      return data
    }
    try {

      // THIS IS AN ISSUE,
      // Occasionally, when transformations are happening in the broadcaster, the children are not plain

      // if (isArray(data)) {
      //   data = data.map(d => this.toPlain(d))
      // }
      // else {
      //   data = this.toPlain(data)
      // }
      return this.binaryDataSchema(object).encode(data)
    }
    catch (err) {
      this.app.log.error(`${this.model.name} ${object} data type encoding`, data, 'failed', err)
      throw new Error(err)
    }
  }

  fromBinaryData (data, object?) {
    if (!Buffer.isBuffer(data)) {
      return data
    }
    try {

      // if (isArray(data)) {
      //   return data.map(d => this.binaryDataSchema(object).decode(d))
      // }
      // else {
        return this.binaryDataSchema(object).decode(data)
      // }
    }
    catch (err) {
      this.app.log.error(`${this.model.name} data type decoding`, data, 'failed', err)
      throw new Error(err)
    }
  }

  toBinaryMetadata (data, object?) {
    if (Buffer.isBuffer(data)) {
      return data
    }
    try {
      return this.binaryMetadataSchema().encode(data)
    }
    catch (err) {
      this.app.log.error(`${this.model.name} metadata type encoding`, object, 'failed', err)
      throw new Error(err)
    }
  }

  fromBinaryMetadata (data, object?) {
    if (!Buffer.isBuffer(data)) {
      return data
    }
    try {
      return this.binaryMetadataSchema().decode(data)
    }
    catch (err) {
      this.app.log.error('metadata type decoding', object, 'failed', err)
      throw new Error(err)
    }
  }

  /**
   * Resolve how to Build Instance(s)
   */
  stage(data, options: { [key: string]: any} = {}): FabrixModel {

    // 0: No data was provided
    if (!data) {
      return
    }
    // 1: This is already a staged DAO instance of this
    // TODO, validate keeping the isStaged check
    else if (data instanceof this.instance) {
    // else if (data instanceof this.instance && data._options.isStaged === true) {
      // TODO, temp, just mark this as staged
      // data._options.isStaged = true
      // Mark options as "staged", that way we can always recreate what we are doing
      // Want to make sure these are always set boolean
      options =  {
        isStaged: true,
        isReloaded: typeof options.isReloaded !== 'undefined' ? options.isReloaded : false, // || !(options.isNewRecord || false) || false,
        isNewRecord: typeof options.isNewRecord !== 'undefined' ? options.isNewRecord : true,
        isSynced: typeof options.isSynced !== 'undefined' ? options.isSynced : false,
        isSynthetic: typeof options.isSynthetic !== 'undefined' ? options.isSynthetic : false,
        ...options
      }

      const raw = Object.assign({}, data.get({plain: true}))

      if (options.before && isArray(options.before)) {
        this.stageBefore(raw, data, options, false)
      }

      if (options.after && isArray(options.after)) {
        this.stageAfter(raw, data, options, false)
      }

      // Build the Instance
      // data = this.build(data, options)
      return data
    }
    // 2: This is a DOA model instance and is being converted to an instance of this (Recursive)
    // Should get as plain and run stage again
    else if (
      data.constructor
      && this.app.models[data.constructor.name]
      && this.app.models[data.constructor.name].instance
    ) {
      return this.stage(data.toJSON(), options)
    }
    // 3: Same as 1 but as an array
    else if (
      isArray(data)
      && data.every(d => d instanceof this.instance)
    ) {
      return data
    }
    // 4: Same as 2 but as an array (Recursive)
    else if (
      isArray(data)
      && data
        .every(d => d.constructor
          && this.app.models[d.constructor.name]
          && this.app.models[d.constructor.name].instance
        )
    ) {
      return data.map(d => this.stage(d.toJSON(), options))
    }
    // 5: Plain objects, but as an array (Recursive)
    // Run each individual item through stage
    // TODO: way too greedy, should be switched
    else if (
      isArray(data)
      && !data
        .every(d => d.constructor
          && this.app.models[d.constructor.name]
          && this.app.models[d.constructor.name].instance
        )
    ) {
      return data.map(d => this.stage(d, options))
    }
    // 5: This is a plain object or plain object array and need to become a DOA.
    // The desired state and we can now run the actual staging event with configuration
    // All the previous steps should result in reaching here unless the data is null
    // Even arrays will be broken down to get here as singletons
    else {
      // Mark this as a list or singleton, so we only have to run isArray once
      const list = isArray(data)

      // If an array of pre configuration functions were supplied
      // ie. pre: [function]
      if (options.pre && isArray(options.pre)) {
        options.pre.forEach(fn => {
          if (typeof fn !== 'function') {
            throw new Error(`Expected stage.options.pre configure ${fn} to be a function`)
          }
          try {
            if (list) {
              data.map(d => {
                d = fn(d, options)
                if (Promise.resolve(d) === d) {
                  throw new Error('stage.options.pre expects_response sync functions, promise was passed')
                }
                return d
              })
            }
            else {
              data = fn(data, options)
              if (Promise.resolve(data) === data) {
                throw new Error('stage.options.pre expects_response sync functions, promise was passed')
              }
            }
          }
          catch (err) {
            throw new Error(err)
          }
        })
      }

      // Clone the data as raw
      let raw = Object.assign({}, data)

      // Mark options as "staged", that way we can always recreate what we are doing
      // Want to make sure these are always set boolean
      options =  {
        isStaged: true,
        isReloaded: typeof options.isReloaded !== 'undefined' ? options.isReloaded : false,
        isNewRecord: typeof options.isNewRecord !== 'undefined' ? options.isNewRecord : true,
        isSynced: typeof options.isSynced !== 'undefined' ? options.isSynced : false,
        isSynthetic: typeof options.isSynthetic !== 'undefined' ? options.isSynthetic : false,
        ...options
      }

      // Build the Instance
      data = this.build(data, options)

      // If an array of configuration functions were supplied
      // configure: ['generateUUID', function]
      if (options.configure && isArray(options.configure)) {
        this.stageConfigure(raw, data, options, list)
      }

      // Stage Before includes
      // before: [function]
      if (options.before && isArray(options.before)) {
        this.stageBefore(raw, data, options, list)
      }

      // If this is a nested stage
      if (options.stage) {
        this.stageIncludes(raw, data, options)
      }

      // If after supplied, run after functions after stage includes
      // after: [function]
      if (options.after && isArray(options.after)) {
        this.stageAfter(raw, data, options, list)
      }

      // Mark this data as previously staged
      // if (options.isStaged) {
        data.isStaged = options.isStaged // Legacy
        // data._options.isStaged = data.isStaged
      // }

      // If this is considered reloaded, then mark it
      // if (options.isReloaded) {
        data.isReloaded = options.isReloaded // Legacy
        // data.set('isReloaded', options.isReloaded)
        // data._options.isReloaded = data.isReloaded
      // }
      // If the options identified this as a new record, then mark it
      // if (options.isNewRecord) {
        data.isNewRecord = options.isNewRecord // Legacy
        // data._options.isNewRecord = data.isNewRecord
      // }
      // If this is considered "synced", aka cross domain resolve, then mark it
      // if (options.isSynced) {
        data.isSynced = options.isSynced // Legacy
        // data._options.isSynced = data.isSynced
      // }
      // If this is considered a non save able object
      data.isSynthetic = data.isSynthetic || options.isSynthetic

      return data
    }
  }

  stageConfigure(raw, data, options, list) {
    // If an array of configuration functions were supplied
    // config: ['generateUUID', function]
    if (options.configure && isArray(options.configure)) {
      options.configure.forEach(fn => {
        try {
          if (list) {
            data.map((d, i) => {
              if (typeof fn === 'string' && typeof d[fn] === 'function') {
                d[fn](d, options)
                raw[i] = defaultsDeep(raw[i], d.get({plain: true}))
              }
              else {
                if (typeof fn !== 'function') {
                  throw new Error(`stage.options.configure expected ${fn} to be or resolve to a function`)
                }
                d = fn(d, options)
                raw[i] = defaultsDeep(raw[i], d.get({plain: true}))
              }
              if (Promise.resolve(d) === d) {
                throw new Error('stage.options.configure expects_response sync functions, promise was passed')
              }
              return d
            })
          }
          else {
            if (typeof fn === 'string' && typeof data[fn] === 'function') {
              data[fn](data, options)
              raw = defaultsDeep(raw, data.get({plain: true}))
            }
            else {
              if (typeof fn !== 'function') {
                throw new Error(`stage.options.configure expected ${fn} to be or resolve to a function`)
              }
              data = fn(data, options)
              raw = defaultsDeep(raw, data.get({plain: true}))
            }

            if (Promise.resolve(data) === data) {
              throw new Error('stage.options.configure expects_response sync functions, promise was passed')
            }
          }
        }
        catch (err) {
          throw new Error(err)
        }
      })
    }
    return data
  }
  /**
   * Resolve how to Build included Instance(s)
   */
  stageIncludes(raw, data, { stage = [] }: {[key: string]: any}) {
    // if (this.model.constructor.name === 'Product') {
    //   console.log('brk ouch 4', stage, this.model.constructor.name, raw, data)
    // }

    stage.forEach(m => {
      const model = m.model
      const name = model && model.constructor ? model.constructor.name : `${ model }`
      const as = m.as
      const def = m.default || null
      const opts = { parent: data, ...m.options }

      if (model && as) {
        // Assign the staged instances to data
        const d = model.stage(raw[as] || def, opts)
        // Ugly Sequelize Hack
        data[as] = d
        data.setDataValue(as, d)
        data.set(as, d)
      }
      else {
        this.app.log.debug(`stageIncludes property ${as} or model ${ name } does not exists on this raw ${this.model.constructor.name}`)
      }
    })
    return data
  }

  stageBefore(raw, data, options, list) {
    // If before supplied, run before functions before staging includes
    // config: [function]
    if (options.before && isArray(options.before)) {
      options.before.forEach(fn => {
        try {

          if (!raw || !data) {
            throw new Error('stage.options.before expects values')
          }

          if (list) {
            data.map((d, i) => {
              if (typeof fn === 'string' && typeof d[fn] === 'function') {
                fn = d[fn]
              }
              if (typeof fn !== 'function') {
                throw new Error(`stage.options.before expected before configure ${fn} to be a function`)
              }

              d = fn(d, options)
              if (Promise.resolve(d) === d) {
                throw new Error('stage.options.before expects_response sync functions, promise was passed')
              }
              raw[i] = defaultsDeep(raw[i], d.get({plain: true}))
              return d
            })
          }
          else {
            if (typeof fn === 'string' && typeof data[fn] === 'function') {
              fn = data[fn]
            }
            if (typeof fn !== 'function') {
              throw new Error(`stage.options.before expected before configure ${fn} to be a function`)
            }

            data = fn(data, options)
            raw = defaultsDeep(raw, data.get({plain: true}))
            if (Promise.resolve(data) === data) {
              throw new Error('stage.options.before expects_response sync functions, promise was passed')
            }
          }

          if (!raw || !data) {
            throw new Error('stage.options.before expects results')
          }
        }
        catch (err) {
          throw new Error(err)
        }
      })
    }

    return data
  }

  stageAfter(raw, data, options, list) {
    // If after supplied, run after functions after stage includes
    // config: [function]
    if (options.after && isArray(options.after)) {
      options.after.forEach(fn => {
        try {

          if (!raw || !data) {
            throw new Error('stage.options.after expects values')
          }

          if (list) {
            data.map((d, i) => {
              if (typeof fn === 'string' && typeof d[fn] === 'function') {
                fn = d[fn]
              }
              if (typeof fn !== 'function') {
                throw new Error(`stage.options.after expected after configure ${fn} to be a function`)
              }

              d = fn(d, options)
              if (Promise.resolve(d) === d) {
                throw new Error('stage.options.after expects_response sync functions, promise was passed')
              }
              raw[i] = defaultsDeep(raw[i], d.get({plain: true}))
              return d
            })
          }
          else {
            if (typeof fn === 'string' && typeof data[fn] === 'function') {
              fn = data[fn]
            }
            if (typeof fn !== 'function') {
              throw new Error(`stage.options.after expected after configure ${fn} to be a function`)
            }
            data = fn(data, options)
            raw = defaultsDeep(raw, data.get({plain: true}))
            if (Promise.resolve(data) === data) {
              throw new Error('stage.options.after expects_response sync functions, promise was passed')
            }
          }

          if (!raw || !data) {
            throw new Error('stage.options.after expects results')
          }
        }
        catch (err) {
          throw new Error(err)
        }
      })
    }
    return data
  }


  mapSeries(...args) {
    return this.app.broadcastSeries(...args)
  }
}
