import { FabrixApp } from '@fabrix/fabrix'
import { FabrixGeneric, FabrixModel } from '@fabrix/fabrix/dist/common'
import { set, get, isArray, isString, isObject } from 'lodash'
import { regexdot } from '@fabrix/regexdot'
import uuid from 'uuid/v4'

import { Broadcast } from './Broadcast'
import { helpers } from './utils/helpers'
import { Saga } from './Saga'


/**
 * Helper function that replaces the parameters of a command_type with the the data
 * @param type
 * @param keys
 * @param object
 */
const replaceParams = function(type = '', keys: boolean | string[] = [], object: any = {}) {
  if (
    keys !== false
    && typeof keys !== 'boolean'
    && isArray(keys)
  ) {
    if (!isArray(object)) {
      keys.forEach(k => {
        if (k && object && object[k]) {
          type = type.replace(`:${k}`, `${object[k]}`)
        }
      })
    }
    else if (isArray(object)) {
      // TODO
      const o = object[0]
      keys.forEach(k => {
        if (k && o && o[k]) {
          type = type.replace(`:${k}`, `${o[k]}`)
        }
      })
    }
  }

  return type
}

export class BroadcastCommand extends FabrixGeneric {
  broadcaster: Broadcast
  req: {[key: string]: any}

  private _command_type: string

  beforeHooks: any

  command_uuid: string
  causation_uuid: string

  readonly object: FabrixModel
  readonly _list: boolean

  // The data
  data: {[key: string]: any} //  | {[key: string]: any}[]
  //
  data_updates: {[key: string]: any} // | {[key: string]: any}[]
  // The data that was moved from updates to data
  data_applied: {[key: string]: any}
  // The data that was moved from updates to data
  data_changed: {[key: string]: any}
  // If reloaded, the values
  data_previous: {[key: string]: any}
  //
  // _data: {[key: string]: any} //  | {[key: string]: any}[]
  // _data_previous: {[key: string]: any} //  | {[key: string]: any}[]
  // _data_updates: {[key: string]: any} //  | {[key: string]: any}[]
  // _data_applied: {[key: string]: any} //  | {[key: string]: any}[]

  // The metadata that will be sent to hooks as well events
  _metadata: {[key: string]: any}

  // Timestamp for when this command was created, will become the event's timestamp as well
  created_at: string

  version: number
  version_app: string

  // TODO? What is this?
  action

  chain_before = []
  chain_saga = []
  chain_after = []
  chain_events?: string[]

  complete = false
  breakException = null
  pattern: RegExp
  pattern_raw: string
  pointer: any
  cancel_methods: any

  // TODO, this may be removed?
  options: {[key: string]: any}
  _event_type?: string
  // _changes: string[]

  constructor(
    app: FabrixApp,
    broadcaster: Broadcast,
    {
      req,
      command_type,
      event_type,
      object,
      correlation_uuid,
      causation_uuid,
      data,
      metadata = {},
      version = 0,
      version_app,
      chain_events = []
    },
    options: {[key: string]: any} = {}
  ) {
    super(app)

    // Make a string into an object if possible, will return undefined if not in app.models
    if (typeof object === 'string') {
      object = app.models[object]
    }
    // Make sure the object is a fabrix model
    if (!(object instanceof FabrixModel)) {
      throw new Error(`Fatal: Command ${command_type} object is not an instance of a Model`)
    }
    // Make sure that the object has binaryData
    if (typeof object.toBinaryData === 'undefined') {
      throw new Error(`Fatal: Command ${command_type} object ${object.constructor.name} does not have a toBinaryData function`)
    }
    // Make sure that the object has binaryMetadata
    if (typeof object.toBinaryMetadata === 'undefined') {
      throw new Error(`Fatal: Command ${command_type} object ${object.constructor.name} does not have a toBinaryMetadata function`)
    }
    // Make sure that this command has access to the object
    if (!app.models[object.constructor.name]) {
      throw new Error(`Fatal: Object is not a valid app model, make sure that it is an app model eg: app.models.${object.constructor.name}`)
    }
    // Make sure that the command parameters are valid
    if (!command_type || typeof command_type !== 'string') {
      throw new Error('Fatal: command_type string is required')
    }

    // Keep a record of the data so we only have to call isArray once
    this._list = isArray(data)

    // Check that these are staged objects
    if (this._list) {
      // console.log('BRK COMMAND DATA OPTS "list"', data.map(d => d._options))
      if (!data.every(d => d._options && d._options.isStaged)) {
        throw new Error(`Fatal: commands only accept staged data eg: ${object.constructor.name}.stage(data, { isNewRecord: false })`)
      }
    }
    else {
      // console.log('BRK COMMAND DATA OPTS', data._options)
      if (!data._options && !data._options.isStaged) {
        throw new Error(`Fatal: commands only accept staged data eg: ${object.constructor.name}.stage(data, { isNewRecord: false })`)
      }
    }

    // Set the broadcaster this command will use
    this.broadcaster = broadcaster
    // Set the request as provided
    this.req = req
    // Create a command uuid, or use the correlation_uuid if it is set
    this.command_uuid = this.generateUUID(correlation_uuid)

    // Set the object of the command
    this.object = object
    // Set the data for the command
    this.data = data
    // Set the values that are wishing to update
    this.data_updates = this._list ? data.map(d => d.toJSON()) : data.toJSON()
    // Make a blank object for previous values of the model instance(s)
    this.data_previous = this._list ? [] : {}
    // Make a blank object for values of the model instance(s) that will change the generated event
    this.data_applied = this._list ? [] : {}
    // The values that have actually changed from the last visit to the database and now
    this.data_changed = this._list ? [] : {}
    // Set the metadata provided
    this._metadata = metadata

    // Set the causation uuid, the event that spawned this command
    this.causation_uuid = causation_uuid
    // Set the Version of this command eg. 1, 2, 3 (it can be a re-issued event that's creating another command)
    this.version = version
    // Mark the Version of the Fabrix App that created this command Originally, or set to current app version
    this.version_app = version_app || this.app.pkg.version
    // Add a Created_at timestamp to command, so that the corresponding event has a timestamp
    this.created_at = new Date(Date.now()).toISOString()
    // Set the previous chain of events that led this this command being created
    this.chain_events = chain_events
    // the initial (root) event this command expects_response to dispatch as a result of the command

    // Use the Setter to set the command_type and also the pattern used
    this.command_type = command_type

    // If an event_type was passed as well
    if (event_type) {
      // the initial (root) event this command expects_response to dispatch as a result of the command
      this._event_type = event_type
    }

    // Set the SAGA before function for the command
    if (options.beforeHooks) {
      if (typeof options.beforeHooks === 'string') {
        const saga = this.getSagaFromHandler(options.beforeHooks)
        const method = this.getSagaMethodFromHandler(options.beforeHooks)
        const _saga = this.getSagaFromString(saga)

        if (_saga && _saga[method]) {
          this.beforeHooks = _saga[method]
        }
        else if (_saga) {
          this.beforeHooks = _saga.before
        }
        else {
          this.beforeHooks = this.app.sagas.BroadcastSaga.before
        }
      }
    }
    else {
      this.beforeHooks = this.app.sagas.BroadcastSaga.before
    }

    this.options = options
  }

  /**
   * Get the current command_type
   */
  get command_type() {
    return this._command_type
  }

  /**
   * Set the command_type, the pattern, and replace the params in the pattern
   */
  set command_type(command_type) {
    const { pattern, keys } = regexdot(command_type)
    const pattern_raw = command_type

    // Set the patterns
    this.pattern = pattern
    this.pattern_raw = pattern_raw

    // Set the command type, and replace the pattern params with data.
    this._command_type = replaceParams(command_type, keys, this.data)
  }

  /**
   * Return a list of all the chained events
   */
  get chain() {
    return [...this.chain_before, ...this.chain_saga, ...this.chain_after]
  }

  generateUUID(correlationUUID?) {
    if (correlationUUID) {
      return correlationUUID
    }
    return uuid()
  }

  // Re-stage the data
  restage() {
    if (this._list) {
      this.data = this.data.map(d => {
        return this.object.stage(d, d._options)
      })
    }
    else {
      this.data = this.object.stage(this.data, this.data._options)
    }
  }

  /**
   * UTILITY
   * @description get app.sagas.<MySaga> returns MySaga
   */
  getSagaFromString(handler: string ): Saga  {
    return get(this.app.sagas, handler)
  }

  /**
   * UTILITY
   * @description Eg MySaga.myMethod returns "MySaga"
   */
  getSagaFromHandler(handler: string): string {
    return isString(handler) ? handler.split('.')[0] : handler
  }

  /**
   * UTILITY
   * @description Eg MySaga.myMethod returns "myMethod"
   * @returns string
   */
  getSagaMethodFromHandler(handler: string): string {
    return isString(handler) ? handler.split('.')[1] : handler
  }

  /**
   * Run Serial or in Parallel TODO
   * @param managers
   * @param args
   */
  process(managers, ...args) {
    // Make Serial True for now // TODO
    let serial = true

    if (serial) {
      return this.broadcastSeries(...args)
    }
    else {
      return this.broadcastParallel(...args)
    }
  }

  /**
   * Utlity to broadcast a series (mapSeries)
   * @param args
   */
  broadcastSeries(...args) {
    return this.app.broadcastSeries(...args)
  }

  /**
   * Utlity to broadcast all at once (Promise.all)
   * @param args
   */
  broadcastParallel(...args) {
    return Promise.all([...args])
  }
  /**
   * Broadcast the event
   * @param validator
   * @param options
   */
  broadcast(validator, options) {
    if (!this.beforeHooks) {
      throw new this.app.errors.GenericError(
        'E_BAD_REQUEST',
        'command.broadcast can not be used if not constructed with options.beforeHooks'
      )
    }
    if (!this._event_type) {
      throw new this.app.errors.GenericError(
        'E_BAD_REQUEST',
        'command.broadcast can not be used if not constructed with an event_type'
      )
    }
    return this.beforeHooks(this, validator, options)
      .then(([_command, _options]) => {
        const event = this.broadcaster.buildEvent({
          event_type: this._event_type,
          correlation_uuid: _command.command_uuid,
          command: _command
        })
        return this.broadcaster.broadcast(event, _options)
      })
  }
  /**
   * Reload the data object from the database
   * @param _data
   * @param options
   * @private
   */
  // private async _reload(_data, options) {
  //   let updates = {}
  //
  //   if (_data && typeof _data.toJSON !== 'function') {
  //     throw new Error('Data does not have toJSON function')
  //   }
  //
  //   if (_data && typeof _data.reload !== 'function') {
  //     throw new Error('Data does not have reload function')
  //   }
  //
  //   if (
  //     _data.isNewRecord
  //     || _data.isReloaded
  //     || _data._options.isNewRecord
  //     || _data._options.isReloaded
  //   ) {
  //     updates = Object.assign({}, _data.toJSON())
  //     return Promise.resolve([_data, updates])
  //   }
  //   else {
  //     updates = Object.assign({}, _data.toJSON())
  //     // Call sequelize's reload function
  //     return _data.reload(options)
  //       .then((vals) => {
  //         // TODO, deprecate one of these
  //         _data.isReloaded = true
  //         _data._options.isReloaded = true
  //
  //         return [_data, updates]
  //       })
  //       .catch(err => {
  //         this.app.log.error(`Command ${this.command_uuid} reload`, err)
  //         return Promise.reject(err)
  //       })
  //   }
  // }

  private async _reload(_data, options) {
    if (_data && typeof _data.reload !== 'function') {
      throw new Error('Data does not have reload function')
    }

    if (_data && typeof _data.toJSON !== 'function') {
      throw new Error('Data does not have toJSON function')
    }

    if (
      _data.isNewRecord
      || _data.isReloaded
      || _data._options.isNewRecord
      || _data._options.isReloaded
    ) {
      return Promise.resolve([_data, null])
    }
    else {
      // Call sequelize's reload function
      return _data.reload(options)
        .then((_previous) => {
          // TODO, deprecate one of these
          _data.isReloaded = true
          _data._options.isReloaded = true

          return [_data, _previous]
        })
        .catch(err => {
          this.app.log.error(`Command ${this.command_uuid} reload`, err)
          return Promise.reject(err)
        })
    }
  }

  /**
   * Reload the data object|array with it's previous values from the database
   * @param options
   */
  // async reload(options) {
  //   if (this._list) {
  //     this.data_updates = []
  //     return this.process(new Map(), this.data, d => {
  //       return this._reload(d, options)
  //         .then(([_data, updates]) => {
  //           this.data_updates.push(updates)
  //           return d
  //         })
  //     })
  //       .then(() => {
  //         return this.data
  //       })
  //   }
  //   else {
  //     return this._reload(this.data, options)
  //       .then(([_data, updates]) => {
  //         this.data_updates = updates
  //         return this.data
  //       })
  //   }
  // }

  async reload(options) {
    if (this._list) {
      return this.process(new Map(), this.data, (d, i) => {
        return this._reload(d, options)
          .then(([_current, previous]) => {
            // If there is previous data after the reload, then set it in the previous list an unapplied
            if (previous) {
              previous.attributes
                .forEach(k => {
                  this.previous(`${i}.${k}`, previous[k])
                })
            }
            // If there is no previous data (new record), then we can mark everything as applied
            else {
              _current.attributes
                .forEach(k => {
                  this.apply(`${i}.${k}`, d[k])
                })
            }
            return d
          })
      })
        .then((results) => {
          return this.data
        })
    }
    else {
      return this._reload(this.data, options)
        // If there is previous data after the reload, then set it in the previous list an unapplied
        .then(([_current, previous]) => {
          if (previous) {
            previous.attributes
              .forEach(k => {
                this.previous(`${k}`, previous[k])
              })
          }
          // If there is no previous data (new record), then we can mark everything as applied
          else {
            _current.attributes
              .forEach(k => {
                this.apply(`${k}`, this.data[k])
              })
          }
          return this.data
        })
    }
  }

  // private _approvedUpdates (_data, _updates, approved = []) {
  //   const applied = {}, previous = {}
  //   Object.keys(_updates).forEach((k, i) => {
  //     if (approved.indexOf(k) > -1) {
  //
  //       // Record the applied changes
  //       if (_data[k] !== _updates[k]) {
  //         applied[k] = _updates[k]
  //         previous[k] = _data[k]
  //       }
  //
  //       // Ugly sequelize hack
  //       _data[k] = _updates[k]
  //       _data.setDataValue(k, _updates[k])
  //       _data.set(k, _updates[k])
  //     }
  //   })
  //   return [previous, applied]
  // }
  //
  // /**
  //  * Allow data to be updates by keys
  //  * @param approved
  //  */
  // approveUpdates(approved = []) {
  //
  //   if (!this.data_updates) {
  //     throw new Error('command.approveUpdates was called before command.reload')
  //   }
  //
  //   if (this._list) {
  //     this.data.forEach((d, i) => {
  //       const [ previous, applied ] = this._approvedUpdates(this.data[i], this.data_updates[i], approved)
  //       this.data_applied[i] = applied
  //       this.data_previous[i] = previous
  //     })
  //   }
  //   else {
  //     const [ previous, applied ] = this._approvedUpdates(this.data, this.data_updates, approved)
  //     this.data_applied = applied
  //     this.data_previous = previous
  //   }
  //
  //   return this.data
  // }

  // private _approvedUpdates (_data, _updates, approved = []) {
  //   const applied = {}, previous = {}
  //   Object.keys(_updates).forEach((k, i) => {
  //     if (approved.indexOf(k) > -1) {
  //
  //       // Record the applied changes
  //       if (_data[k] !== _updates[k]) {
  //         applied[k] = _updates[k]
  //         previous[k] = _data[k]
  //       }
  //
  //       // Ugly sequelize hack
  //       _data[k] = _updates[k]
  //       _data.setDataValue(k, _updates[k])
  //       _data.set(k, _updates[k])
  //     }
  //   })
  //   return [previous, applied]
  // }

  private _approvedUpdates (_data, _updates, approved = []) {
    const applied = {}, previous = {}
    Object.keys(JSON.parse(JSON.stringify(_updates))).forEach((k, i) => {
      if (approved.indexOf(k) > -1) {

        // Record the applied changes
        if (_data[k] !== _updates[k]) {
          applied[k] = _updates[k]
          previous[k] = _data[k]
        }
      }
    })
    return [previous, applied]
  }

  approveUpdates(approved = []) {

    if (this._list) {
      this.data.forEach((d, i) => {
        const [ previous, applied ] = this._approvedUpdates(this.data[i], this.data_updates[i], approved)
        Object.keys(applied)
          .forEach(k => {
            this.apply(`${i}.${k}`, applied[k])
          })
      })
    }
    else {
      const [ previous, applied ] = this._approvedUpdates(this.data, this.data_updates, approved)
      Object.keys(applied)
        .forEach(k => {
          this.apply(`${k}`, applied[k])
        })
    }

    return this.data
  }

  previous(path, value) {
    // Set the previous value for the field as the current value
    set(this.data_previous, path, value)
  }
  update(path, value) {
    // Set the updates value for the field
    set(this.data_updates, path, value)
  }
  change(path, value) {
    // Set the changed value
    set(this.data_changed, path, value)
  }
  /**
   * Apply data so it is detected in the changes after a reload
   * @param path
   * @param value
   */
  apply(path, value) {
    const current = get(this.data, path, null)

    // Set the value in change if changed
    if (current !== value) {
      this.change(path, current)
    }

    // Set the previous value for the field as the current value
    this.previous(path, current)

    // Set the data_updates value
    this.update(path, value)

    // Set the data_applied value
    set(this.data_applied, path, value)

    // Apply the value tot he model
    if (this._list) {
      this.data.forEach((k, i) => {
        // TODO, temporary fix to handle first level children for now
        const split = path.split(`${i}.`).slice(1).join('')
        // Ugly sequelize hack
        this.data[i][split] = value
        this.data[i].setDataValue(split, value)
        this.data[i].set(split, value)
      })
    }
    else {
      // Ugly sequelize hack
      this.data[path] = value
      this.data.setDataValue(path, value)
      this.data.set(path, value)
    }
  }
  //
  // private _combine (_data, _updates) {
  //   _updates = _updates.toJSON ? _updates.toJSON() : _updates
  //
  //   Object.keys(_updates).forEach((k, i) => {
  //     // Ugly sequelize hack
  //     _data[k] = _updates[k]
  //     _data.setDataValue(k, _updates[k])
  //     _data.set(k, _updates[k])
  //   })
  //   return _data
  // }
  //
  // combine(data) {
  //
  //   if (!data) {
  //     throw new Error('command.combine was called with empty data')
  //   }
  //
  //   if (this._list) {
  //     this.data.forEach((d, i) => {
  //       this._combine(this.data[i], data[i])
  //     })
  //   }
  //   else {
  //     this._combine(this.data, data)
  //   }
  //
  //   return this.data
  // }

  /**
   * Add a created_at value to the data
   */
  createdAt() {
    if (this._list) {
      this.data.forEach((d, i) => {
        if (d) {
          // d.created_at = new Date(Date.now()).toISOString()
          this.apply(`${i}.created_at`, new Date(Date.now()).toISOString())
        }
      })
    }
    else if (this.data) {
      // this.data.created_at = new Date(Date.now()).toISOString()
      this.apply(`created_at`, new Date(Date.now()).toISOString())
    }
    return this
  }

  /**
   * Add an updated_at value to the data
   */
  updatedAt() {
    if (this._list) { // && this.changes().length > 0) {
      // TODO this doesn't look right, since there will be an array of data and an array of changes
      this.data.forEach((d, i) => {
        if (d) {
          // d.updated_at = new Date(Date.now()).toISOString()
          this.apply(`${i}.updated_at`, new Date(Date.now()).toISOString())
        }
      })
    }
    else if (this.data) { //  && this.changes().length > 0) {
      // this.data.updated_at = new Date(Date.now()).toISOString()
      this.apply(`updated_at`, new Date(Date.now()).toISOString())
    }
    return this
  }

  /**
   * Add an updated_at value to the data
   */
  deletedAt() {
    if (this._list) { // && this.changes().length > 0) {
      // TODO this doesn't look right, since there will be an array of data and an array of changes
      this.data.forEach((d, i) => {
        if (d) {
          // d.deleted_at = new Date(Date.now()).toISOString()
          this.apply(`${i}.deleted_at`, new Date(Date.now()).toISOString())
        }
      })
    }
    else if (this.data) { //  && this.changes().length > 0) {
      // this.data.deleted_at = new Date(Date.now()).toISOString()
      this.apply(`deleted_at`, new Date(Date.now()).toISOString())
    }
    return this
  }

  /**
   * Log Changes into the Metadata
   */
  changes() {
    let changes = []

    if (this._list) {
      this.data.forEach((d, i) => {
        if (d.isNewRecord) {
          changes[i] = [...(changes[i] || []), ...d.attributes]
        }
        else if (this.data_changed && this.data_changed[i]) {
          return changes[i] = [...(changes[i] || []), ...Object.keys(this.data_changed[i])]
        }
        // if (this.data_updates && this.data_updates[i]) {
        //   //
        // }
        // if (d && typeof d.changed === 'function') {
        //   const dChanges = d.changed() || []
        //   return changes.push({[i]: dChanges})
        // }
      })
    }
    else if (!this._list) {
      if (this.data.isNewRecord) {
        changes = [...changes, ...this.data.attributes]
      }
      else if (Object.keys(this.data_changed || {}).length > 0) {
        changes = [...changes, ...Object.keys(this.data_changed)]
      }

      // console.log('BRK non seq changes', changes, Object.keys(this.data_changed || {}))
      // console.log('BRK seq changes', this.data.changed(), this.data.previous())
    }
    // else if (this.data && typeof this.data.changed === 'function') {
    //   changes = this.data.changed() || []
    // }

    if (!isArray(changes)) {
      throw new Error('metadata changes should be an array')
    }

    this.app.log.silly(`${this.command_type} ${this.object.constructor.name} changes`, changes)

    return changes
  }

  get metadata (): {[key: string]: any} {
    return {
      ...this._metadata,
      changes: this.changes()
    }
  }

  set metadata (metadata) {
    this._metadata = metadata
    return
  }
}

export interface Command {
  toJSON(): any
  getDataValue(handler, command): any
  mergeData(method, handler, command): any
  mergeAs(method, handler, command): any
  mergeEachAs(method, handler, command): any
  includeAs(method, handler, data): any
  changed(key?): boolean
  // changes(key?): string[]
}

BroadcastCommand.prototype.changed = function(str?) {
  if (str && this.metadata && this.metadata.changes) {
    return !!this.metadata.changes[str]
  }
  return false
}

// BroadcastCommand.prototype.changes = function() {
//   return this.metadata.changes
// }

BroadcastCommand.prototype.toJSON = function(str) {

  const res = {
    command_type: `${this.command_type}`,
    pattern: `${this.pattern}`,
    pattern_raw: `${this.pattern_raw}`,
    object: `${this.object.constructor.name}${this._list ? '.list' : '' }`,
    data: this.data.toJSON ? this.data.toJSON() : this.data,
    data_updates: this.data_updates,
    metadata: this.metadata,
    causation_uuid: this.causation_uuid,
    version: this.version,
    version_app: this.version_app,
    created_at: this.created_at
  }

  return res
}

BroadcastCommand.prototype.getDataValue = function(str) {
  if (str === 'object') {
    return `${this.object.constructor.name}${this._list ? '.list' : '' }`
  }
  return this[str]
}

BroadcastCommand.prototype.mergeData = function(method, handler, command) {
  // If merge: {as: <string>}
  if (
    isObject(handler.merge)
    && handler.merge.as
    && !handler.merge.each
  ) {
    return this.mergeAs(method, handler, command)
  }
  // If merge: {as: <string>, each: true}
  else if (
    isObject(handler.merge)
    && handler.merge.as
    && handler.merge.each
  ) {
    return this.mergeEachAs(method, handler, command)
  }
  // If merge: true
  else {
    if (
      handler.expects_response
      && handler.expects_response !== '*'
      && command.getDataValue('object') !== handler.expects_response) {
      throw new Error(
        `Hook: ${method} merge expected ${handler.expects_response} but got ${command.getDataValue('object')} for ${ command.command_type}`
      )
    }

    // if (this.data !== command.data) {
    //   console.log('brk mergedata not equal', this.command_type, this.data, command.data)
    // }
    // Test for Errors
    if (!command || !command.data) {
      this.app.log.debug('BroadcastCommand.mergeData was passed empty data')
      return this
    }
    // 1) If this is the same return before anmore checks
    if (this.data === command.data) {
      return this
    }
    // 2) Check type
    if (isArray(command.data) && !isArray(this.data)) {
      throw new Error('expected command data to be an object to match data')
    }
    // 3) Check type
    if (!isArray(command.data) && isArray(this.data)) {
      throw new Error('expected command data to be an array to match data')
    }
    // 4) Merge Arrays TODO
    if (isArray(this.data) && isArray(command.data)) {
      //
      this.app.log.error('Unhandled Array merge attempted')
    }
    else {
      const cleanData = command.data.toJSON ? command.data.toJSON() : command.data

      this.app.log.silly(
        this.command_type,
        'merging values',
        Object.keys(this.data.toJSON()), '->', cleanData
      )

      Object.keys(cleanData).forEach(k => {
        this.data[k] = command.data[k] !== 'undefined'
          ? command.data[k]
          : this.data[k]
      })
    }

    this.app.log.debug(
      `Handler ${method} merged ${this.command_type} -> ${command.command_type}`
    )

    return this
  }
}

BroadcastCommand.prototype.handleData = function(method, handler, command) {
  helpers.handle(this.data, command.data, handler.data)
  return this
}
BroadcastCommand.prototype.handleMetadata = function(method, handler, command) {
  helpers.handle(this.metadata, command.metadata, handler.metadata)
  return this
}

BroadcastCommand.prototype.mergeAs = function(method, handler, command) {
  if ((!handler.merge && !handler.mergeAs) || !command || !command.data) {
    this.app.log.debug(`BroadcastCommand.mergeAs was passed empty handler mergeAs property or command.data for ${command.command_type}`)
    return this
  }
  if (
    handler.expects_response
    && handler.expects_response !== '*'
    && command.getDataValue('object') !== handler.expects_response
  ) {
    throw new Error(`mergeAs expected ${handler.expects_response} but got ${command.getDataValue('object')} for ${ command.command_type}`)
  }

  const as = handler.mergeAs || handler.merge.as

  this.data[as] = command.data
  // if (this.data instanceof this.object.instance) {
  //   // Sequelize ugly hack
  //   this.data.set(name, command.data)
  //   this.data.setDataValue(name, command.data)
  // }

  this.app.log.debug(
    `Handler ${method} merged each ${this.command_type} -> ${command.command_type}`,
    ` as ${as}`
  )

  return this
}

BroadcastCommand.prototype.mergeEachAs = function(method, handler, command) {
  if ((!handler.merge && !handler.mergeEachAs) || !command || !command.data) {
    this.app.log.debug(
      `BroadcastCommand.mergeEachAs was passed empty handler mergeEachAs property or command.data for ${command.command_type}`
    )
    return this
  }
  this.app.log.debug(
    `Handler ${method} merged each ${this.command_type} -> ${command.command_type}`,
    ` as ${ handler.mergeEachAs || handler.merge.as }`
  )
  // if (handler.expects_response && command.getDataValue('object') !== handler.expects_response) {
  //   throw new Error(`mergeAs expected ${handler.expects_response}
  //   but got ${command.getDataValue('object')} for ${ command.command_type}`)
  // }
  // this.data[handler.mergeAs] = command.data
  // if (this.data instanceof this.object.instance) {
  //   // Sequelize ugly hack
  //   this.data.set(name, command.data)
  //   this.data.setDataValue(name, command.data)
  // }

  return this
}

BroadcastCommand.prototype.includeAs = function(method, handler, command) {
  if (!handler.includeAs || !command || !command.data) {
    this.app.log.debug(`BroadcastCommand.includeAs was passed empty includeAs property or command.data for ${command.command_type}`)
    return this
  }

  if (
    handler.expects_response
    && handler.expects_response !== '*'
    && command.getDataValue('object') !== handler.expects_response
  ) {
    throw new Error(`includeAs expected ${handler.expects_response} but got ${command.getDataValue('object')} for ${ command.command_type}`)
  }

  this.includes = this.includes || {}
  this.includes[handler.includeAs] = command.data
  return this
}
