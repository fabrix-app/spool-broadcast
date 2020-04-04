// tslint:disable:max-line-length
import { isArray, isObject } from 'lodash'
import { BroadcastModel } from '../../BroadcastModel'
import { regexdot } from '@fabrix/regexdot'
import { helpers } from '../../utils/helpers'

/**
 * @module BroadcastEvent
 * @description Item Channel Model n:m
 */
export class BroadcastEvent extends BroadcastModel {

  static config (app, Sequelize) {
    return {
      options: {
        underscored: true,
        updatedAt: false,
        // hierarchy: {
        //   childrenAs: 'causations',
        //   levelFieldName: 'causation_hierarchy_level',
        //   foreignKey: 'causation_uuid',
        //   through: 'BroadcastEventAncestor',
        //   throughKey: 'event_uuid',
        //   throughForeignKey: 'ancestor_uuid',
        //   throughTable: 'broadcasteventancestors'
        // },
        indexes: [
          {
            name: 'broadcast_event_index',
            fields: ['event_uuid']
          },
          {
            name: 'broadcast_event_type_index',
            fields: ['event_type', 'object']
          },
          {
            name: 'broadcast_event_primary_keys_index',
            fields: ['primary_keys'],
            using: 'GIN',
            operator: 'jsonb_path_ops'
          },
          {
            name: 'broadcast_event_artifact_uuids_index',
            fields: ['causation_uuid', 'correlation_uuid']
          },
          {
            name: 'broadcast_event_artifact_patterns_index',
            fields: ['pattern_raw', 'correlation_pattern_raw']
          }
        ],
        hooks: {
          beforeValidate: [
            // (event, options) => {
            // }
          ],
          beforeSave: [
            (event, options) => {
              // Bump the version
              event.version++

              if (isArray(event.data)) {
                event.data.map(d => {
                  // If the data models have an encryption method, then make sure it encrypts
                  if (typeof d.encrypt === 'function') {
                    return d.encrypt()
                  }
                })
              }
              else {
                // If the data model has an encryption method, then make sure it encrypts
                if (typeof event.data.encrypt === 'function') {
                  event.data.encrypt()
                }
              }
              return event
            }
          ],
          afterSave: [
            (event, options) => {

              if (isArray(event.data)) {
                event.data.map(d => {
                  // If the data models have a decryption method, then make sure it decrypts
                  if (typeof d.decrypt === 'function') {
                    return d.decrypt()
                  }
                })
              }
              else {
                // If the data model has an decryption method, then make sure it decrypts
                if (typeof event.data.decrypt === 'function') {
                  event.data.decrypt()
                }
              }

              return event
            }
          ]
        }
      }
    }
  }

  static schema (app, Sequelize) {
    return {
      // ID
      event_uuid: {
        type: Sequelize.UUID,
        primaryKey: true,
        binaryOptional: false,
        binaryType: 'string'
      },
      // CTE: Causation Id of the event is the Event Id of the event we are responding to
      causation_uuid: {
        type: Sequelize.UUID,
        // references: {
        //   // This is a reference to another model
        //   model: app.models.BroadcastEvent.instance,
        //   // This is the column name of the referenced model
        //   key: 'event_uuid',
        //   // This declares when to check the foreign key constraint.
        //   deferrable: Sequelize.Deferrable.INITIALLY_DEFERRED
        // },
        binaryOptional: true,
        binaryType: 'string'
      },
      // CTE Helper
      causation_hierarchy_level: {
        type: Sequelize.INTEGER,
        binaryOptional: true,
        binaryType: 'int'
      },
      // Correlation Id of the event we are responding to in our event
      correlation_uuid: {
        type: Sequelize.UUID,
        binaryOptional: true,
        binaryType: 'string'
      },
      // The command string pattern
      correlation_pattern: {
        type: Sequelize.VIRTUAL(Sequelize.STRING, ['correlation_pattern_raw']),
        get: function() {
          const { pattern } = regexdot(this.correlation_pattern_raw || '')
          return pattern
        },
        binaryOptional: true,
        binaryType: 'regex'
      },
      // The command string pattern raw
      correlation_pattern_raw: {
        type: Sequelize.STRING,
        binaryOptional: true,
        binaryType: 'string'
      },

      // The event string
      event_type: {
        type: Sequelize.STRING,
        binaryOptional: false,
        binaryType: 'string'
      },

      // The event string pattern
      pattern: {
        type: Sequelize.VIRTUAL(Sequelize.STRING, ['pattern_raw']),
        get: function() {
          const { pattern } = regexdot(this.pattern_raw || '')
          return pattern
        },
        binaryOptional: true,
        binaryType: 'regex'
      },

      // The event string pattern raw
      pattern_raw: {
        type: Sequelize.STRING,
        binaryOptional: true,
        binaryType: 'string'
      },

      primary_keys: {
        type: Sequelize.JSONB,
        set: function(val) {
          let res = []

          if (
            this._object
            && this._object.primaryKeys
            && this._data
          ) {
            if (isArray(this._data)) {
              res = this._data.reduce((keys, d) => [...keys, ...this._object.primaryKeys(d)], [])
            }
            else {
              res = this._object.primaryKeys(this._data)
            }
          }
          // else {
          //   app.log.warn('get primary_keys called before it was set')
          // }
          this.setDataValue('primary_keys', res)
        },
        get: function() {
          let res = []

          if (
            this._object
            && this._object.primaryKeys
            && this._data
          ) {
            if (isArray(this._data)) {
              res = this._data.reduce((keys, d) => [...keys, ...this._object.primaryKeys(d)], [])
            }
            else {
              res = this._object.primaryKeys(this._data)
            }
          }
          // else {
          //   app.log.warn('get primary_keys called before it was set')
          // }
          return res
        },
        binaryOptional: true,
        binaryType: 'json'
      },
      object: {
        type: Sequelize.STRING,
        allowNull: false,
        binaryOptional: false,
        binaryType: 'string',
        set: function(val) {
          if (typeof val === 'string') {
            this.setDataValue('object', val)
            this._object = app.models[val.replace(/\.[^.].*/, '')]
          }
          else {
            this._object = val
          }
        },
        get: function() {
          return this._object
        },
        validate: {
          validateModel(val) {
            if (!app.models[val.replace(/\.[^.].*/, '')]) {
              throw new Error('Not a valid model')
            }
          }
        },
      },
      data: {
        type: Sequelize.BLOB,
        binaryOptional: false,
        binaryType: 'json',
        set: function(val) {
          if (Buffer.isBuffer(val)) {
            this.setDataValue('data', val)
            // this.setDataValue('_data', )
            this._data = this.object.fromBinaryData(val, this.getDataValue('object'))
          }
          else {
            this._data = val
          }
        },
        get: function() {
          return this._data
        },
        validate: {
          validateBinary(val) {
            if (!Buffer.isBuffer(val)) {
              throw new Error('Not a valid binary')
            }
          }
        },
      },
      _object: {
        type: Sequelize.VIRTUAL(Sequelize.JSONB, ['_data']),
        binaryOptional: true,
        binaryType: 'json',
        set: function(val) {
          if (typeof val === 'string') {
            this.setDataValue('object', val)
            // throw new Error('_object value CAN NOT BE A STRING')
            val = app.models[val.replace(/\.[^.].*/, '')]
          }
          this.setDataValue('_object', val)

          let list = ''

          if (isArray(this._data)) {
            list = '.list'
          }
          this.setDataValue('object', `${val.constructor.name}${list}`)
          this.primary_keys = [this.object, this.data]
        },
        validate: {
          validateBinary(val) {
            if (typeof val === 'string') {
              throw new Error('Not a valid model')
            }
          }
        },
      },
      // TODO completely refactor to something that makes sense
      _data: {
        type: Sequelize.VIRTUAL(Sequelize.JSONB, ['object']),
        binaryOptional: true,
        binaryType: 'json',
        set: function(val) {
          if (Buffer.isBuffer(val)) {
            throw new Error('_data value CAN NOT BE A BUFFER')
          }
          // Hold the data before analyzing
          this.setDataValue('_data', val)

          // Object should already be defined
          if (!this.getDataValue('object')) {
            throw new Error('object is not defined for _data')
          }

          // Set the object as either a list or object
          if (isArray(val)) {
            this.setDataValue('object', `${this.getDataValue('object').replace(/\.[^.].*/, '')}.list`)
          }
          else {
            this.setDataValue('object', `${this.getDataValue('object').replace(/\.[^.].*/, '')}`)
          }

          // Validate data
          if (val && val instanceof this.object.instance) {
            // console.log('brk', 1)
            val = val.get({plain: true})
          }
          else if (val && val.constructor === Object) {
            // console.log('brk', 2)
            val = val // .get({plain: true})
          }
          else if (val && !isArray(val)) {
            // console.log('brk', 3)
            this.app.log.debug(
              `Warning, is ${val.constructor ? val.constructor.name : 'plain'} object
              but not matching instance ${this.getDataValue('object')}`,
              val
            )
            val = val.get ? val.get({plain: true}) : val
          }
          else if (val && isArray(val) && val.every(d => d instanceof this.object.instance)) {
            // console.log('brk', 4)
            val = val.map(d => d.get({plain: true}))
          }
          else if (val && isArray(val) && val.every(d => d.constructor === Object)) {
            // console.log('brk', 5)
            val = val.map(d => d) // .get({plain: true}))
          }
          else if (val && isArray(val)) {
            // console.log('brk', 6)
            this.app.log.debug(
              `Warning, is Array but not matching instances of ${this.getDataValue('object')}`,
              val
            )
            val = val.map(d => d.get ? d.get({plain: true}) : d)
          }

          // Set the data so it can be handled by the types
          this.setDataValue('data', this.object.toBinaryData(val, this.getDataValue('object')))
          this.primary_keys = [this.object, this.data]
        },
        validate: {
          validateData(val) {
            // if (!isArray(val) || !isObject(val)) {
            //   throw new Error('Not a _data value')
            // }
          }
        },
      },
      // Binary of Metadata
      metadata: {
        type: Sequelize.BLOB,
        binaryOptional: false,
        binaryType: 'json',
        set (val) {
          if (Buffer.isBuffer(val)) {
            this.setDataValue('metadata', val)
            this._metadata = this.object.fromBinaryMetadata(val, this.getDataValue('object'))
          }
          else {
            this._metadata = val
          }
        },
        get () {
          return this._metadata
        },
        validate: {
          validateBinary(val) {
            if (!Buffer.isBuffer(val)) {
              throw new Error('Not a valid binary')
            }
          }
        },
      },
      _metadata: {
        type: Sequelize.VIRTUAL(Sequelize.JSONB, ['object']),
        binaryOptional: true,
        binaryType: 'json',
        set(val) {
          if (Buffer.isBuffer(val)) {
            throw new Error('_metadata value CAN NOT BE A BUFFER')
          }
          if (!this.getDataValue('object')) {
            throw new Error('object is not defined for _metadata')
          }
          this.setDataValue('_metadata', val)
          this.setDataValue('metadata', this.object.toBinaryMetadata(val, this.getDataValue('object')))
        },
        validate: {
          validateData(val) {
            if (!isObject(val)) {
              throw new Error('Not a _metadata value')
            }
          }
        },
      },
      // req: {
      //   type: Sequelize.VIRTUAL(Sequelize.JSONB),
      //   binaryOptional: true,
      //   binaryType: 'json'
      // },
      includes: {
        type: Sequelize.VIRTUAL(Sequelize.JSONB),
        binaryOptional: true,
        binaryType: 'json'
      },

      version: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        binaryOptional: true,
        binaryType: 'int'
      },

      version_app: {
        type: Sequelize.STRING,
        defaultValue: app.pkg.version,
        binaryOptional: true,
        binaryType: 'string'
      },

      // The current tree being run
      pointer: {
        type: Sequelize.VIRTUAL(Sequelize.STRING),
        binaryOptional: true,
        binaryType: 'string'
      },
      // The methods to invoice on cancellation
      cancel_methods: {
        type: Sequelize.VIRTUAL(Sequelize.JSONB),
        binaryOptional: true,
        binaryType: 'json'
      },

      // The before hooks that were used
      chain_before: {
        type: Sequelize.JSONB,
        defaultValue: [],
        binaryOptional: true,
        binaryType: 'json'
      },
      // The hooks that were used
      chain_saga: {
        type: Sequelize.JSONB,
        defaultValue: [],
        binaryOptional: true,
        binaryType: 'json'
      },
      // The after hooks that were used
      chain_after: {
        type: Sequelize.JSONB,
        defaultValue: [],
        binaryOptional: true,
        binaryType: 'json'
      },
      // The events that were fried
      chain_events: {
        type: Sequelize.JSONB,
        set: function(values) {
          values = ([...values]).filter(n => n)
          return this.setDataValue('chain_events', values)
        },
        defaultValue: [],
        binaryOptional: true,
        binaryType: 'json'
      },
      // complete sequence of what happened on this event
      chain: {
        type: Sequelize.VIRTUAL(Sequelize.JSONB, ['chain_before', 'chain_saga', 'chain_after', 'chain_events']),
        defaultValue: [],
        get: function() {
          return ([...this.chain_before, ...this.chain_saga, ...this.chain_after, ...this.chain_events]).filter(n => n)
        },
        binaryOptional: true,
        binaryType: 'json'
      },
      // Live Mode
      live_mode: {
        type: Sequelize.BOOLEAN,
        defaultValue: app.config.get('platform.live_mode') || false,
        binaryOptional: true,
        binaryType: 'boolean'
      },
      // When this event was created
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        binaryOptional: false,
        binaryType: 'date'
      },

      // If the data in this event is a projection
      is_projection: {
        type: Sequelize.VIRTUAL(Sequelize.BOOLEAN),
        defaultValue: false,
        binaryOptional: true,
        binaryType: 'boolean'
      },
    }
  }

  /**
   * Associate the Model
   * @param models
   */
  public static associate (models) {

  }
}

// BroadcastEvent.prototype = BroadcastModel.prototype

export interface BroadcastEvent extends BroadcastModel {
  toJSON(): {[key: string]: any}
  generateUUID(config?, options?): BroadcastEvent

  changes(key?): boolean | string | string[]

  handleData(method, manager, event): any
  handleMetadata(method, manager, event): any

  mergeData(method, manager, event): any
  mergeAs(method, manager, event): any
  mergeEachAs(method, manager, event): any
  mergeAsArray(method, manager, event): any
  pushOn(method, manager, event): any
  pushEachOn(method, manager, event): any
  includeOn(method, manager, event): any
  includeAs(method, manager, event): any
  zip(method, manager, event): any
  zipEachOn(method, manager, event): any
}

BroadcastEvent.prototype.handleData = function(method, manager, event) {
  helpers.handle(this.data, event.data, manager.data)
  return this
}

/**
 * If the the metadata includes a change or all the change
 * @param key
 */
BroadcastEvent.prototype.changes = function(key?) {
  if (key) {
    if (!isArray(this._data)) {
      if (this.metadata.changes.includes(key)) {
        return key
      } else {
        return false
      }
    }
    else {
      return this._data.map((d, i) => {
        return this.metadata.changes[i].includes(key)
      })
    }
  }
  else {
    return this.metadata.changes
  }
}

BroadcastEvent.prototype.handleMetadata = function(method, manager, event) {
  helpers.handle(this.metadata, event.metadata, manager.metadata)
  return this
}

BroadcastEvent.prototype.mergeData = function(method, manager, event) {
  const object = isArray(event) ? event.map(e => e.getDataValue('object')) : event.getDataValue('object')
  // If merge: {as: <string>}
  if (
    isObject(manager.merge)
    && (manager.merge.as || manager.mergeAs)
    && (!manager.merge.each)
  ) {
    return this.mergeAs(method, manager, event)
  }
  // If merge: {as: <string>, each: true}
  else if (
    isObject(manager.merge)
    && (manager.merge.each)
  ) {
    return this.mergeEachAs(method, manager, event)
  }
  // If merge: true
  else {

    // If the manager expects_response certain data...
    if (manager.expects_response) {
      if (typeof manager.expects_response === 'string' && object !== manager.expects_response) {
        throw new Error(`${method} merge expected ${manager.expects_response} but got ${object} for ${event.event_type}`)
      }
      else if (Array.isArray(manager.expects_response) && manager.expects_response.indexOf(object) === -1) {
        throw new Error(
          `${method} merge expected ${manager.expects_response.join(', ')} but got ${object} for ${event.event_type}`
        )
      }
    }
    // If the manager doesn't expect certain data, but the data is completely different...
    else if (
      !manager.expects_response
      && this.getDataValue('object') !== object
    ) {
      this.app.log.warn(
        method, 'Merge Data',
        this.event_type, 'assuming it expects_response',
        this.getDataValue('object'), 'and received', object
      )
    }

    // Test for Errors
    if (!event || !event.data) {
      this.app.log.debug('BroadcastEvent.mergeData was passed empty data')
      return this
    }
    // 1) If this is the same return before any more checks
    if (this.data === event.data) {
      return this
    }
    // 2) Check type
    if (isArray(event.data) && !isArray(this.data)) {
      throw new Error('expected event data to be an object to match data')
    }
    // 3) Check type
    if (!isArray(event.data) && isArray(this.data)) {
      throw new Error('expected event data to be an array to match data')
    }
    // 4) Merge Arrays TODO
    if (isArray(this.data) && isArray(event.data)) {
      if (this.data.length === event.data.length) {

        event.data.forEach((d, i) => {
          const keys = Object.keys(d.toJSON())

          this.app.log.silly(
            method,
            this.event_type,
            `index ${i}`,
            'folding values',
            Object.keys(this.data[i].toJSON()), '->', Object.keys(d.toJSON())
          )

          keys.forEach(key => {
            this.data[i][key] = d[key]
          })
        })

      }
      else {
        this.app.log.error('Unhandled Array merge attempted')
      }
    }
    else {
      this.app.log.silly(
        method,
        this.event_type,
        'folding values',
        Object.keys(this.data.toJSON()), '<-', Object.keys(event.data.toJSON())
      )

      Object.keys(event.data.toJSON()).forEach(k => {
        this.data[k] = event.data[k] !== 'undefined' ? event.data[k] : this.data[k]
      })
    }
    this.app.log.debug(
      `Manager ${method} folded ${this.event_type} <- ${event.event_type}`
    )

    return this
  }
}

/**
 * Merge data from one event to another
 * Set mergeAsArray to true, if the event.data and the previous event.data are both Arrays and want the zipped
 * @param method
 * @param manager
 * @param event
 */
BroadcastEvent.prototype.mergeAs = function(method, manager, event) {
  const object = isArray(event) ? event.map(e => e.getDataValue('object')) : event.getDataValue('object')
  const event_type = isArray(event) ? event.map(e => e.event_type) : event.event_type
  let merge = isArray(event) ? event.map(e => e.data) : event.data

  const expected = isArray(event)
    ? manager.expects_response && event.every(e => e.getDataValue('object') === manager.expects_response)
    : manager.expects_response && object !== manager.expects_response

  if (
    (!manager.merge.as)
    || !event
  ) {
    this.app.log.debug(`${method} unhandled mergeAs was passed empty manager merge.as property or event.data for ${event_type}`)
    return this
  }

  if (!isArray(event)) {
    if (
      manager.expects_response
      && object !== manager.expects_response
    ) {
      throw new Error(`${method} unhandled mergeAs expected ${manager.expects_response} but got ${object} for ${event_type}`)
    } else if (
      !manager.expects_response
      && this.getDataValue('object') !== object
    ) {
      this.app.log.debug(
        method,
        this.event_type,
        'assumes it expected',
        this.getDataValue('object'),
        'and received', object
      )
    }
  }
  else {
    if (
      manager.expects_response
      && event.every(o => o.getDataValue('object') !== manager.expects_response)
    ) {
      throw new Error(
        `${method} unhandled mergeAs expected ${manager.expects_response} but got ${object} for ${event.map(o => o.event_type)}`
      )
    } else if (
      !manager.expects_response
      && event.every(o => o.getDataValue('object') !== this.getDataValue('object'))
    ) {
      this.app.log.debug(
        method,
        this.event_type,
        'assumes it expected a list of',
        this.getDataValue('object'),
        'and received', event.map(o => o.getDataValue('object'))
      )
    }
  }

  const as = manager.mergeAs || manager.merge.as

  // TODO abstract and turn into "zip"
  if (manager.mergeAsArray === true) {
    this.app.log.warn('Convert to zip', method, 'for', this.event_type)
    this.data[as] = [...(this.data[as] || []), ...(isArray(merge) ? merge : [merge])]
  }
  else {
    this.data[as] = merge
    // this.data.set(manager.mergeAs, merge)
    // this.data.setDataValue(manager.mergeAs, merge)
  }
  // if (this.data instanceof this.object.instance) {
  //   // Sequelize ugly hack
  //   this.data.set(name, event.data)
  //   this.data.setDataValue(name, event.data)
  // }

  this.app.log.debug(
    `Manager ${method} merged ${this.event_type} <- ${event_type} as ${as}`
  )

  return this
}

/**
 * Push data from one event to another
 * Set pushAsArray to true, if the event.data and the previous event.data are both Arrays and want the zipped by primary key result
 * @param method
 * @param manager
 * @param event
 */
BroadcastEvent.prototype.pushOn = function(method, manager, event) {
  let push = event.data

  if (
    (!manager.push.on)
    || !event
    || !event.data
  ) {
    this.app.log.debug(`${method} pushOn was passed empty manager push.on property or event.data for ${event.event_type}`)
    return this
  }

  if (
    manager.expects_response
    && event.getDataValue('object') !== manager.expects_response
  ) {
    throw new Error(`${method} pushOn expected ${manager.expects_response} but got ${event.getDataValue('object')} for ${ event.event_type}`)
  }
  else if (
    !manager.expects_response
    && this.getDataValue('object') !== event.getDataValue('object')
  ) {
    this.app.log.debug(
      method,
      this.event_type,
      'assumes it expected',
      this.getDataValue('object'),
      'and received', event.getDataValue('object')
    )
  }

  const on = manager.pushOn || manager.push.on

  this.data[on] = this.data[on] || []

  if (isArray(push)) {
    // TODO check if unique by model primary keys
    push.forEach(i => {
      this.data[on].push(i)
    })
  }
  else {
    this.data[on].push(push)
    // this.data.set(manager.pushAs, push)
    // this.data.setDataValue(manager.pushAs, push)
  }
  // if (this.data instanceof this.object.instance) {
  //   // Sequelize ugly hack
  //   this.data.set(name, event.data)
  //   this.data.setDataValue(name, event.data)
  // }

  this.app.log.debug(
    `Manager ${method} pushed ${this.event_type} -> ${event.event_type} on ${on}`
  )

  return this
}

/**
 * Nest events to data as a key
 * @param method
 * @param manager
 * @param events
 */
BroadcastEvent.prototype.mergeEachAs = function(method, manager, events) {
  if ((!manager.merge.each && !manager.merge.each.as) || !events || !events) {
    this.app.log.debug(
      `${method} BroadcastEvent.merge.each.as was passed empty manager merge.each.as property or events for ${events.map(o => o.event_type)}`
    )
    return this
  }
  if (!isArray(this.data) && !isArray(events)) {
    this.app.log.debug(
      `${method} BroadcastEvent.merge.each.as expects_response data and the events to both be arrays`
    )
    return this
  }

  this.app.log.warn('Convert to zip', method, 'for', this.event_type)

  const as = manager.mergeEachAs || manager.merge.each.as || manager.merge.as

  this.data.forEach((d, i) => {
    if (
      events[i]
      && events[i][0]
      && (events[i][0].action !== false
      || events[i][0].action !== 'retry')
    ) {
      if (
        manager.expects_response
        && events[i][0].getDataValue
        && events[i][0].getDataValue('object') !== manager.expects_response
      ) {
        throw new Error(
          `mergeAs expected ${manager.expects_response} but got ${events[i][0].getDataValue('object')} for ${ events[i][0].event_type}`
        )
      }
      d[as] = events[i][0].data
    }
    else {
      //
    }
  })

  this.app.log.debug(
    `Manager ${method} merged ${this.event_type} -> ${events.map(e => e.event_type) } each as ${as}`
  )

  return this
}


/**
 * Nest events to data as a key
 * @param method
 * @param manager
 * @param events
 */
BroadcastEvent.prototype.pushEachOn = function(method, manager, events) {
  if ((!manager.push.each && !manager.push.each.on) || !events || !events) {
    this.app.log.debug(
      `${method} BroadcastEvent.merge.each.as was passed empty manager merge.each.as property or events for ${events[0].event_type}`
    )
    return this
  }
  if (!isArray(this.data) && !isArray(events)) {
    this.app.log.debug(
      `${method} BroadcastEvent.merge.each.as expects_response data and the events to both be arrays`
    )
    return this
  }

  const on = manager.pushEachAs || manager.push.each.on || manager.push.on

  this.data.forEach((d, i) => {
    if (
      events[i]
      && events[i][0]
      && (events[i][0].action !== false
      || events[i][0].action !== 'retry')
    ) {
      if (
        manager.expects_response
        && events[i][0].getDataValue
        && events[i][0].getDataValue('object') !== manager.expects_response
      ) {
        throw new Error(
          `pushOn expected ${manager.expects_response} but got ${events[i][0].getDataValue('object')} for ${ events[i][0].event_type}`
        )
      }
      d[on] = d[on] || []
      d[on].push(events[i][0].data)
    }
    else {
      //
    }
  })

  this.app.log.debug(
    `Manager ${method} pushed ${this.event_type} -> ${events.map(e => e.event_type) } each on ${on}`
  )

  return this
}

BroadcastEvent.prototype.includeOn = function(method, manager, event) {

  if ((!manager.include) || !event || !event.data) {
    this.app.log.debug(`BroadcastEvent.include was passed empty includeAs property or event.data for ${event.event_type}`)
    return this
  }

  // If include: { as: <string> }
  if (isObject(manager.include) && manager.include.as) {
    return this.includeAs(method, manager, event)
  }
  // If include: true
  else {

    if (manager.expects_response && event.getDataValue('object') !== manager.expects_response) {
      throw new Error(`${method} includeAs expected ${manager.expects_response} but got ${event.getDataValue('object')} for ${event.event_type}`)
    }
    this.includes = this.includes || {}
    this.includes[event.getDataValue('object')] = event.data

    this.app.log.debug(
      `Manager ${method} included ${this.event_type} -> ${event.event_type }`
    )

    return this
  }
}

BroadcastEvent.prototype.includeAs = function(method, manager, event) {
  if ((!manager.include && !manager.include.as) || !event || !event.data) {
    this.app.log.debug(`BroadcastEvent.include was passed empty include.as property or event.data for ${event.event_type}`)
    return this
  }

  if (manager.expects_response && event.getDataValue('object') !== manager.expects_response) {
    throw new Error(`${method} includeAs expected ${manager.expects_response} but got ${event.getDataValue('object')} for ${ event.event_type}`)
  }

  this.includes = this.includes || {}
  this.includes[manager.include.as] = event.data

  this.app.log.debug(
    `Manager ${method} included ${this.event_type} -> ${event.event_type } as ${manager.include.as}`
  )

  return this
}

BroadcastEvent.prototype.zip = function(method, manager, event) {
  if ((!manager.zip) || !event) {
    this.app.log.debug(`BroadcastEvent.zip was passed empty include.as property or event.data for ${event.event_type}`)
    return this
  }

  const object = isArray(event) ? event.map(e => e.getDataValue('object')) : event.getDataValue('object')
  const event_type = isArray(event) ? event.map(e => e.event_type) : event.event_type
  const expected = isArray(event)
    ? manager.expects_response && event.every(e => e.getDataValue('object') === manager.expects_response)
    : manager.expects_response && object !== manager.expects_response

  let zip = isArray(event) ? event.map(e => e.data) : event.data

  if (manager.expects_response && !expected) {
    throw new Error(
      `${method} zip expected ${manager.expects_response} but got ${object} for ${ isArray(event) ? event.map(e => e.event_type) : event.event_type }`
    )
  }

  // Scenario 1: Both the event and sub-event are arrays
  if (isArray(this.data) && isArray(zip)) {
    if (manager.zip.on) {
      const on = manager.zip.on

      zip.forEach(d => {
        const key = d[on]
        const prev = this.data.findIndex(_d => {
          if (isArray(on)) {
            // TODO handle array of on
            // return _d[on] === key
          }
          return _d[on] === key
        })

        if (key && prev > -1) {
          const keys = Object.keys(d.toJSON())

          this.app.log.silly(
            method,
            this.event_type,
            'zipping values',
            Object.keys(this.data[prev].toJSON()), '<-', Object.keys(d.toJSON()),
            `on ${on}`
          )

          keys.forEach(_key => {
            this.data[prev][_key] = d[_key]
          })

        }
        else {
          this.app.log.debug(
            `Unhandled Manager ${method} zip ${this.event_type} -> ${ event_type } on ${manager.zip.on ? manager.zip.on : manager.zip } ${key} is not found in parent event data`
          )
        }
      })
    }
    // Scenario 1.2 Acts like a Merge
    else {
      // This currently works like merge...
      zip.forEach((d, i) => {
        const keys = Object.keys(d.toJSON())

        keys.forEach(_key => {
          this.data[i][_key] = d[_key]
        })
      })
    }
  }
  // Scenario 2: The event is an object and sub-event is array
  else if (!isArray(this.data) && isArray(zip)) {
    this.app.log.debug(
      `Unhandled Manager ${method} zip ${this.event_type} object to array -> ${ event_type } on ${manager.zip.on ? manager.zip.on : manager.zip }`
    )
  }
  // Scenario 3: The event is an array and sub-event is an object
  else if (isArray(this.data) && !isArray(event.data)) {
    this.app.log.debug(
      `Unhandled Manager ${method} zip ${this.event_type} array to object -> ${ event_type } on ${manager.zip.on ? manager.zip.on : manager.zip }`
    )
  }
  // Unknown Scenario
  else {
    this.app.log.debug(
      `Unhandled Manager ${method} zip ${this.event_type} -> ${ event_type } on ${manager.zip.on ? manager.zip.on : manager.zip }`
    )
  }

  return this
}

BroadcastEvent.prototype.zipEachOn = function(method, manager, event) {
  this.app.log.debug(
    `Unhandled Manager ${method} zip each ${this.event_type} -> ${event.event_type } on ${manager.zip.on ? manager.zip.on : manager.zip }`
  )

  return this
}
