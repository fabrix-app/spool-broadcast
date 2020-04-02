import { FabrixApp } from '@fabrix/fabrix'
import { FabrixGeneric, FabrixModel } from '@fabrix/fabrix/dist/common'
import { set, get, isArray, isString, isObject, isEqual, differenceWith, xor } from 'lodash'
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

const raw = function(val) {
  if (typeof val !== 'undefined' && (
    typeof val === 'string'
    || typeof val === 'boolean'
    || typeof val === 'number'
    || typeof val === 'bigint'
  )) {
    // do nothing
  }
  else if (typeof val !== 'undefined' && val instanceof FabrixModel) {
    // If this is a Model instance, then call it's JSON function to make it a plain object
    val = JSON.parse(JSON.stringify(val))
  }
  else if (typeof val !== 'undefined' && isObject(val)) {
    val = JSON.parse(JSON.stringify(val))
  }
  else if (typeof val !== 'undefined' && isArray(val)) {
    val = JSON.parse(JSON.stringify(val))
  }
  return val
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
  // Set the data values that are wishing to update
  data_updates: {[key: string]: any} // | {[key: string]: any}[]
  // The data that was moved from updates to data
  data_applied: {[key: string]: any}
  // The data that was moved from updates to data
  data_changed: {[key: string]: any}
  // If reloaded, the values
  data_previous: {[key: string]: any}

  // The metadata that will be sent to hooks as well events
  _metadata: {[key: string]: any}
  _hooks: {[key: string]: any}
  _changes: {[key: string]: any}

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
      hooks =  [],
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
      if (
        !data._options
        && !data._options.isStaged
      ) {
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
    this.data_updates = this._list ? data.map(d => d.get({plain: true})) : data.get({plain: true})
    // Make a blank object for previous values of the model instance(s)
    this.data_previous = this._list ? [] : {}
    // Make a blank object for values of the model instance(s) that will change the generated event
    this.data_applied = this._list ? [] : {}
    // The values that have actually changed from the last visit to the database and now
    this.data_changed = this._list ? [] : {}
    // Set the metadata provided
    this._metadata = metadata || {}

    // Set the saga hooks provided
    this._hooks = hooks || []

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

    // Set the SAGA "before" function for this command if supplied
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
          // Otherwise, set it to default one we know exists
          this.beforeHooks = this.app.sagas.BroadcastSaga.before
        }
      }
    }
    else {
      // Otherwise, set it to default one we know exists
      this.beforeHooks = this.app.sagas.BroadcastSaga.before
    }
    // Set any options that were provided
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
   * Return a list of all the chained events including the ones that were run before this command
   */
  get chain() {
    return [
      ...this.chain_before,
      ...this.chain_saga,
      ...this.chain_after
    ]
  }

  generateUUID(correlationUUID?) {
    if (correlationUUID) {
      return correlationUUID
    }
    return uuid()
  }

  private async _reload(_data, options) {
    if (_data && typeof _data.reload !== 'function') {
      throw new Error('Data does not have reload function')
    }

    // If this is reloaded, return the data, and the data as previous (assumes that this was created in a projection?)
    if (
      _data.isReloaded
      // || _data._options.isReloaded
    ) {
      return Promise.resolve([_data, _data])
    }
    // If this is a new record, return the data, an empty previous
    else if (
      _data.isNewRecord
      // || _data._options.isNewRecord
    ) {
      _data.isReloaded = true
      return Promise.resolve([_data, null])
    }
    else {
      // Call sequelize's reload function
      return _data.reload(options)
        .then((_previous) => {
          // TODO, deprecate one of these
          _data.isReloaded = true
          // _data._options.isReloaded = true

          return [_data, _previous]
        })
        .catch(err => {
          this.app.log.error(`Command ${this.command_uuid} reload`, err)
          return Promise.reject(err)
        })
    }
  }

  async reload(options) {
    if (this._list) {
      return this.process(new Map(), this.data, (d, i) => {
        return this._reload(d, options)
          .then(([_current, previous]) => {
            // If there is previous data after the reload, then set it in the previous list as un-applied
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
                  this.previous(`${i}.${k}`, null)
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
        // If there is previous data after the reload, then set it in the previous list as un-applied
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
                this.previous(`${k}`, null)
                this.apply(`${k}`, this.data[k])
              })
          }
          return this.data
        })
    }
  }

  /**
   * Returns a tuple of the previous values, and the new values of a single data object
   */
  private _approvedUpdates (_data, _updates, approved = []) {
    const applied = {}, previous = {}

    Object.keys(JSON.parse(JSON.stringify(_updates))).forEach((k, i) => {
      if (approved.indexOf(k) > -1) {

        // Record the applied changes
        if (!isEqual(_data[k], _updates[k])) {
          applied[k] = _updates[k]
          previous[k] = _data[k]
        }
      }
    })
    return [previous, applied]
  }

  /**
   * Approve a list of values
   * @param approved
   */
  approveUpdates(approved: string[] = []) {

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

  /**
   * Approve a single value
   * @param approved
   */
  approveUpdate(approved: string) {
    return this.approveUpdates([approved])
  }


  /**
   * Returns the new values of a single data object
   */
  private _approvedChanges (_data, _updates, approved = []) {
    const applied = {}, updated = {}

    Object.keys(JSON.parse(JSON.stringify(_data))).forEach((k, i) => {
      if (approved.indexOf(k) > -1) {
        applied[k] = _data[k]

        // Record the applied changes
        if (!isEqual(_data[k], _updates[k])) {
          updated[k] = _data[k]
        }
      }
    })
    return [updated, applied]
  }

  /**
   * When the command data is modified directly, it will be reset to previous values on "reload", unless they are applied.
   * This function applies that data if it is not already applied
   * @param approved string[]
   */
  approveChanges(approved: string[] = []) {
    if (this._list) {
      this.data.forEach((d, i) => {
        const [ updated, applied ] = this._approvedChanges(this.data[i], this.data_updates[i], approved)
        Object.keys(updated)
          .forEach(k => {
            this.update(`${i}.${k}`, applied[k])
          })
        Object.keys(applied)
          .forEach(k => {
            this.apply(`${i}.${k}`, applied[k])
          })
      })
    }
    else {
      const [ updated, applied ] = this._approvedChanges(this.data, this.data_updates, approved)
      Object.keys(updated)
        .forEach(k => {
          this.update(`${k}`, applied[k])
        })
      Object.keys(applied)
        .forEach(k => {
          this.apply(`${k}`, applied[k])
        })
    }
    return this.data
  }

  /**
   * Approve a single value
   * @param approved
   */
  approveChange(approved) {
    return this.approveChanges([approved])
  }

  /**
   * Set Previous data value at path
   * @param path
   * @param value
   */
  previous(path, value) {
    // Set the previous value for the field as the current value
    return set(this.data_previous, path, value, null)
  }
  /**
   * Set Updates data value at path
   * @param path
   * @param value
   */
  update(path, value) {
    // Set the updates value for the field
    return set(this.data_updates, path, value)
  }

  /**
   * Set Change data value at path
   * @param path
   * @param value
   */
  change(path, value) {
    // Set the changed value
    return set(this.data_changed, path, value, null)
  }
  /**
   * Apply data so it is detected in the changes after a reload
   * @param path
   * @param value
   */
  apply(path: string, value?): any {
    // If the value wasn't passed, then assume we are setting the value as the current value in data
    if (typeof value === 'undefined') {
      value = get(this.data, path, null)
    }
    // Get the value that was here previously
    const current = get(this.data_previous, path, null)

    // Create some raw comparison attributes
    const rawCurrent = raw(current)
    const rawValue = raw(value)

    // Set the value in change if changed
    if (!isEqual(rawCurrent, rawValue)) {
      this.change(path, current)
    }

    // Set the data_updates value
    this.update(path, value)

    // Set the data_applied value
    set(this.data_applied, path, value)

    // Set the data
    set(this.data, path, value)

    return get(this.data, path)
  }

  /**
   * Return keys in the current data object that are not in the applied data object
   */
  unapplied(): string[] {
    let unapplied

    if (this._list) {
      unapplied = []
      this.data.forEach((d, i) => {
        const current = this.data[i].attributes
        const applied = Object.keys(this.data_applied[i])
        unapplied.push(xor(applied, current))
      })
    }
    else {
      //
      const current = this.data.attributes
      const applied = Object.keys(this.data_applied)
      unapplied = xor(applied, current)
    }

    return unapplied
  }

  /**
   * Return keys that are in the current data object and are in the changed data object
   */
  updated(): string[] {
    let unapplied

    if (this._list) {
      unapplied = []
      this.data.forEach((d, i) => {
        const current = this.data[i].attributes
        const applied = Object.keys(this.data_changed[i])
        // unapplied.push(xor(applied, current))
        unapplied.push(applied)
      })
    }
    else {
      //
      const current = this.data.attributes
      const applied = Object.keys(this.data_changed)
      unapplied = applied // xor(applied, current)
    }

    return unapplied
  }
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
        if (
          d.isNewRecord
          // || d._options.isNewRecord
        ) {
          changes[i] = [...(changes[i] || []), ...d.attributes]
        }
        else if (this.data_changed && this.data_changed[i]) {
          return changes[i] = [...(changes[i] || []), ...Object.keys(this.data_changed[i])]
        }
      })
    }
    else if (!this._list) {
      if (
        this.data.isNewRecord
        // || this.data._options.isNewRecord
      ) {
        changes = [...changes, ...this.data.attributes]
      }
      else if (Object.keys(this.data_changed || {}).length > 0) {
        changes = [...changes, ...Object.keys(this.data_changed)]
      }
    }

    if (!isArray(changes)) {
      throw new Error('metadata changes should be an array')
    }

    this.app.log.silly(`${this.command_type} ${this.object.constructor.name} changes`, changes)

    return changes
  }

  /**
   * Get the hooks that are running during this command
   */
  get hooks() {
    return this._hooks || []
  }

  /**
   * Set the hooks that are running during this command
   */
  set hooks(values) {
    this._hooks = values
  }

  /**
   * This makes sure that the metadata returned contains the changes and hooks and can not be overridden by others
   */
  get metadata (): {[key: string]: any} {
    return {
      ...(this._metadata || {}),
      changes: this.changes(),
      hooks: this.hooks
    }
  }

  /**
   * Sets the underlying metadata to what the user wants
   * @param metadata
   */
  set metadata (metadata) {
    this._metadata = metadata
    return
  }

  /**
   * UTILITY
   * "Re-stage" the data, incase of corruption
   */
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
   * UTILITY
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
   * UTILITY
   * to broadcast a series (mapSeries)
   * @param args
   */
  broadcastSeries(...args) {
    return this.app.broadcastSeries(...args)
  }

  /**
   * UTILITY
   * to broadcast all at once (Promise.all)
   * @param args
   */
  broadcastParallel(...args) {
    return Promise.all([...args])
  }
  /**
   * UTILITY
   * Broadcast the event
   * @param validator
   * @param options
   */
  broadcast(validator, options) {
    if (!this.beforeHooks) {
      throw new this.app.errors.GenericError(
        'E_BAD_REQUEST',
        'command.broadcast can not be used if not constructed with options.beforeHooks',
        `${this.name} Command Error`
      )
    }
    if (!this._event_type) {
      throw new this.app.errors.GenericError(
        'E_BAD_REQUEST',
        'command.broadcast can not be used if not constructed with an event_type',
        `${this.name} Command Error`
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
}

export interface Command {
  toJSON(): any
  toEVENT(): any
  getDataValue(handler, command): any
  mergeData(method, handler, command): any
  mergeAs(method, handler, command): any
  mergeEachAs(method, handler, command): any
  includeAs(method, handler, data): any
  changed(key?): boolean
  // changes(key?): string[]
}

/**
 * Mimics the Sequelize model's "changed" instance method
 * @param str
 */
BroadcastCommand.prototype.changed = function(str?): boolean | string[] {
  if (str && this.metadata && this.metadata.changes) {
    return !!this.metadata.changes[str]
  }
  else if (!str && this.metadata && this.metadata.changes) {
    return this.metadata.changes
  }
  return false
}

// BroadcastCommand.prototype.changes = function() {
//   return this.metadata.changes
// }

BroadcastCommand.prototype.toJSON = function(str): {[key: string]: any} {

  const res = {
    correlation_uuid: this.correlation_uuid,
    causation_uuid: this.causation_uuid,
    command_type: `${this.command_type}`,
    pattern: `${this.pattern}`,
    pattern_raw: `${this.pattern_raw}`,
    object: `${this.object.constructor.name}${this._list ? '.list' : '' }`,
    data: JSON.parse(JSON.stringify(this.data)),
    data_changed: JSON.parse(JSON.stringify(this.data_changed)),
    data_previous: JSON.parse(JSON.stringify(this.data_previous)),
    metadata: this.metadata,
    version: this.version,
    version_app: this.version_app,
    created_at: this.created_at
  }
  return res
}

BroadcastCommand.prototype.toEVENT = function(str): {[key: string]: any} {

  const res = {
    correlation_uuid: this.correlation_uuid,
    causation_uuid: this.causation_uuid,
    command_type: `${this.command_type}`,
    pattern: this.pattern,
    pattern_raw: `${this.pattern_raw}`,
    object: this.object,
    data: this.data,
    data_changed: this.data_changed,
    data_previous: this.data_previous,
    metadata: this.metadata,
    version: this.version,
    version_app: this.version_app,
    created_at: this.created_at,
    chain_before: this.chain_before,
    chain_saga: this.chain_saga,
    chain_after: this.chain_after,
    chain_events: this.chain_events,
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
      throw new Error('unhandled expected command data to be an object to match data')
    }
    // 3) Check type
    if (!isArray(command.data) && isArray(this.data)) {
      throw new Error('unhandled expected command data to be an array to match data')
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

        this.apply(k, command.data[k] !== 'undefined'
          ? command.data[k]
          : this.data[k])

        // this.data[k] = command.data[k] !== 'undefined'
        //   ? command.data[k]
        //   : this.data[k]
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
