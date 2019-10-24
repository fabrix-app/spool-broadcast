import {FabrixApp} from '@fabrix/fabrix'
import { FabrixGeneric, FabrixModel } from '@fabrix/fabrix/dist/common'
import { get, isArray, isObject } from 'lodash'
import uuid from 'uuid/v4'

import { Broadcast } from './Broadcast'

export class BroadcastCommand extends FabrixGeneric {
  broadcaster: Broadcast
  req: {[key: string]: any}
  command_type: string
  command_uuid: string
  causation_uuid: string
  object: FabrixModel
  data: {[key: string]: any} //  | {[key: string]: any}[]
  data_updates: {[key: string]: any} // | {[key: string]: any}[]
  metadata: {[key: string]: any}
  created_at: string // Date
  version: number
  action
  chain_before = []
  chain_saga = []
  chain_after = []
  chain_events?: string[]
  complete = false
  breakException = null
  pointer: any
  cancel_methods: any
  // event_type?: string = null

  constructor(
    app: FabrixApp,
    broadcaster: Broadcast,
    {
      req,
      command_type,
      object,
      correlation_uuid,
      causation_uuid,
      data,
      metadata = {},
      version = 0,
      chain_events = [],
      // event_type = null
    }
  ) {
    super(app)

    if (!(object instanceof FabrixModel)) {
      throw new Error(`Command ${command_type} object is not an instance of a Model`)
    }
    if (typeof object.toBinaryData === 'undefined') {
      throw new Error(`Command ${command_type} object ${object.constructor.name} does not have a toBinaryData function`)
    }
    if (typeof object.toBinaryMetadata === 'undefined') {
      throw new Error(`Command ${command_type} object ${object.constructor.name} does not have a toBinaryMetadata function`)
    }
    if (!app.models[object.constructor.name]) {
      throw new Error('object is not a valid model')
    }

    // this.app = app
    this.broadcaster = broadcaster
    this.req = req
    this.command_uuid = this.generateUUID(correlation_uuid)
    this.object = object
    this.command_type = command_type
    this.causation_uuid = causation_uuid
    this.data = data
    this.metadata = metadata
    this.version = version
    this.created_at = new Date(Date.now()).toISOString()
    this.chain_events = chain_events
    // the initial (root) event this command expects to dispatch as a result of the command
    // this.event_type = event_type
  }

  get chain() {
    return [...this.chain_before, ...this.chain_saga, ...this.chain_after]
  }

  generateUUID(correlationUUID?) {
    if (correlationUUID) {
      return correlationUUID
    }
    return uuid()
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
      return this.mapSeries(...args)
    }
    else {
      return Promise.all([...args])
    }
  }

  mapSeries(...args) {
    return this.app.spools.sequelize._datastore.Promise.mapSeries(...args)
  }

  /**
   * Reload the data object
   * @param _data
   * @param options
   * @private
   */
  private async _reload(_data, options) {
    let updates = {}

    if (_data && typeof _data.toJSON !== 'function') {
      throw new Error('Data does not have toJSON function')
    }
    if (_data && typeof _data.reload !== 'function') {
      throw new Error('Data does not have reload function')
    }

    if (_data.isNewRecord || _data.isReloaded) {
      updates = Object.assign({}, _data.toJSON())
      return Promise.resolve([_data, updates])
    }
    else {
      updates = Object.assign({}, _data.toJSON())
      return _data.reload(options)
        .then(() => {
          _data.isReloaded = true
          return [_data, updates]
        })
        .catch(err => {
          this.app.log.error(`Command ${this.command_uuid} reload`, err)
          return Promise.reject(err)
        })
    }
  }

  /**
   * Reload the data object|array
   * @param options
   */
  async reload(options) {
    if (isArray(this.data)) {
      this.data_updates = []
      return this.process(new Map(), this.data, d => {
        return this._reload(d, options)
          .then(([_data, updates]) => {
            this.data_updates.push(updates)
            return d
          })
      })
        .then(() => {
          return this.data
        })
    }
    else {
      return this._reload(this.data, options)
        .then(([_data, updates]) => {
          this.data_updates = updates
          return this.data
        })
    }
  }

  private _approvedUpdates (_data, _updates, approved = []) {
    Object.keys(_updates).forEach((k, i) => {
      if (approved.indexOf(k) > -1) {
        // Ugly sequelize hack
        _data[k] = _updates[k]
        _data.setDataValue(k, _updates[k])
        _data.set(k, _updates[k])
      }
    })
    return _data
  }

  /**
   * Allow data to be updates by keys
   * @param approved
   */
  approveUpdates(approved = []) {

    if (!this.data_updates) {
      throw new Error('command.approveUpdates was called before command.reload')
    }

    if (isArray(this.data)) {
      this.data.forEach((d, i) => {
        this._approvedUpdates(this.data[i], this.data_updates[i], approved)
      })
    }
    else {
      this._approvedUpdates(this.data, this.data_updates, approved)
    }

    return this.data
  }

  private _combine (_data, _updates) {
    _updates = _updates.toJSON ? _updates.toJSON() : _updates

    Object.keys(_updates).forEach((k, i) => {
      // Ugly sequelize hack
      _data[k] = _updates[k]
      _data.setDataValue(k, _updates[k])
      _data.set(k, _updates[k])
    })
    return _data
  }

  combine(data) {

    if (!data) {
      throw new Error('command.combine was called with empty data')
    }

    if (isArray(this.data)) {
      this.data.forEach((d, i) => {
        this._combine(this.data[i], data[i])
      })
    }
    else {
      this._combine(this.data, data)
    }

    return this.data
  }

  /**
   * Add a created_at value to the data
   */
  createdAt() {
    if (isArray(this.data)) {
      this.data.forEach((d, i) => {
        if (d) {
          d.created_at = new Date(Date.now()).toISOString()
        }
      })
    }
    else if (this.data) {
      this.data.created_at = new Date(Date.now()).toISOString()
    }
    return this
  }

  /**
   * Add an updated_at value to the data
   */
  updatedAt() {
    if (isArray(this.data)) { // && this.changes().length > 0) {
      // TODO this doesn't look right, since there will be an array of data and an array of changes
      this.data.forEach((d, i) => {
        if (d) {
          d.updated_at = new Date(Date.now()).toISOString()
        }
      })
    }
    else if (this.data) { //  && this.changes().length > 0) {
      this.data.updated_at = new Date(Date.now()).toISOString()
    }
    return this
  }

  /**
   * Log Changes into the Metadata
   */
  changes() {
    let changes = []

    if (isArray(this.data)) {
      this.data.forEach((d, i) => {
        if (d && typeof d.changed === 'function') {
          const dChanges = d.changed() || []
          return changes.push({[i]: dChanges})
        }
      })
    }
    else if (this.data && typeof this.data.changed === 'function') {
      changes = this.data.changed() || []
    }

    if (!isArray(changes)) {
      throw new Error('metadata changes should be an array')
    }

    this.app.log.silly(`${this.object.constructor.name} changes`, changes)

    return this.metadata.changes = changes
  }
}

export interface Command {
  getDataValue(handler, command): any
  mergeData(method, handler, command): any
  mergeAs(method, handler, command): any
  mergeEachAs(method, handler, command): any
  includeAs(method, handler, data): any
}

BroadcastCommand.prototype.getDataValue = function(str) {
  if (str === 'object') {
    return `${this.object.constructor.name}${isArray(this.data) ? '.list' : '' }`
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
    if (handler.expects && command.getDataValue('object') !== handler.expects) {
      throw new Error(
        `Hook: ${method} merge expected ${handler.expects} but got ${command.getDataValue('object')} for ${ command.command_type}`
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
      this.app.log.silly(
        this.command_type,
        'merging values',
        Object.keys(this.data.toJSON()), '->', Object.keys(command.data.toJSON())
      )

      Object.keys(command.data.toJSON()).forEach(k => {
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

BroadcastCommand.prototype.mergeAs = function(method, handler, command) {
  if ((!handler.merge && !handler.mergeAs) || !command || !command.data) {
    this.app.log.debug(`BroadcastCommand.mergeAs was passed empty handler mergeAs property or command.data for ${command.command_type}`)
    return this
  }
  if (handler.expects && command.getDataValue('object') !== handler.expects) {
    throw new Error(`mergeAs expected ${handler.expects} but got ${command.getDataValue('object')} for ${ command.command_type}`)
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
  // if (handler.expects && command.getDataValue('object') !== handler.expects) {
  //   throw new Error(`mergeAs expected ${handler.expects} but got ${command.getDataValue('object')} for ${ command.command_type}`)
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

  if (handler.expects && command.getDataValue('object') !== handler.expects) {
    throw new Error(`includeAs expected ${handler.expects} but got ${command.getDataValue('object')} for ${ command.command_type}`)
  }

  this.includes = this.includes || {}
  this.includes[handler.includeAs] = command.data
  return this
}
