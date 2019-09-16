import { FabrixGeneric as Generic } from '@fabrix/fabrix/dist/common'
import { get, isArray } from 'lodash'
import { Broadcast } from './Broadcast'
import { Command } from './Command'
import { FabrixApp } from '@fabrix/fabrix'
import { mapSeries } from 'bluebird'

/**
 * @module Hook
 * @description Hook
 */
export class Hook {
  public app: FabrixApp
  public options
  public command
  public message
  public isAcknowledged
  public lifecycle = 'before'
  public isCancelled
  private _id

  constructor(app: FabrixApp, command, options, lifecycle?) {
    this.app = app
    this.command = command
    this.options = options
    this.lifecycle = lifecycle || this.lifecycle

    this.id = this.command.command_uuid
    this.isAcknowledged = false
    this.isCancelled = false
  }

  /**
   * Return the id of this task
   */
  get id () {
    return this._id
  }

  set id (id) {
    this._id = id
  }

  get name() {
    return this.constructor.name
  }

  async run (): Promise<any> {
    throw new Error('Subclasses must override Hook.run')
  }
  async cancel (): Promise<any> {
    throw new Error('Subclasses must override Hook.cancel')
  }

  /**
   * Acknowledge the command
   */
  async ack(): Promise<any> {
    if (!this.isAcknowledged) {
      this.isAcknowledged = true
      return Promise.resolve([this.command, this.options])
    }
    else {
      this.app.log.warn(`${this.name} attempting to ack a message that already responded`)
      return Promise.resolve([this.command, this.options])
    }
  }

  /**
   * Don't Acknowledge the command
   */
  async nack(): Promise<any> {
    if (!this.isAcknowledged) {
      this.isAcknowledged = true
      return Promise.reject([this.command, this.options])
    }
    else {
      this.app.log.warn(`${this.name} attempting to nack a message that already responded`)
      return Promise.reject([this.command, this.options])
    }
  }

  /**
   * Reject the command
   */
  async reject(): Promise<any> {
    if (!this.isAcknowledged) {
      this.isAcknowledged = true
      return Promise.reject([this.command, this.options])
    }
    else {
      this.app.log.warn(`${this.name} attempting to reject a message that already responded`)
      return Promise.reject([this.command, this.options])
    }
  }

  entries(name) {
    if (!this.app.spools.broadcast) {
      throw new Error('Spool-broadcast is not loaded!')
    }
    return this.app.spools.broadcast.entries(name)
  }

  public Sequelize() {
    if (!this.app.spools.sequelize) {
      throw new Error('Spool-sequelize is not loaded!')
    }
    return this.app.spools.sequelize._datastore
  }

  // Utilities
  public mapSeries(...args) {
    if (this.app && this.app.spools && this.app.spools.sequelize) {
      return this.Sequelize().Promise.mapSeries(...args)
    }
    else {
      // return mapSeries(...args)
      throw new Error('Spool Sequelize is not yet loaded')
    }
  }
}


export class HookIn extends Generic {

  private _broadcasters: Map<string, Broadcast> = new Map()
  private _protectedMethods = ['getBroadcaster', 'addBroadcaster', 'removeBroadcaster', 'hasBroadcaster']

  constructor(app: FabrixApp) {
    super(app)
    const broadcasters = Object.keys(
      this.app.config.get(`broadcast.hooks.${this.name}.broadcasters`)
      || {}
    )

    // this._broadcasters =
    broadcasters.forEach((k) => {
      if (this.app.broadcasts[k]) {
        this.addBroadcaster(this.app.broadcasts[k])
      }
      else {
        this.app.log.error(`Attempting to register broadcast ${ k } on hook ${this.name}, but ${k} was not found in api/broadcasts`)
      }
    })
  }

  get name() {
    return this.constructor.name
  }

  getBroadcaster (name) {
    return this._broadcasters.get(name)
  }
  /**
   * Add a Broadcaster
   * @param broadcaster
   */
  addBroadcaster (broadcaster: Broadcast) {
    this._broadcasters.set(broadcaster.name, broadcaster)
    return this.broadcasters
  }

  /**
   * Remove a Broadcaster
   * @param broadcaster
   */
  removeBroadcaster (broadcaster: Broadcast) {
    this._broadcasters.delete(broadcaster.name)
    return this.broadcasters
  }

  hasBroadcaster (broadcaster: Broadcast) {
    return this.broadcasters.has(broadcaster.name)
  }

  get broadcasters () {
    return this._broadcasters
  }

  set broadcasters (broadcasters) {
    throw new Error(`Can not map broadcasters through this method`)
  }
}
