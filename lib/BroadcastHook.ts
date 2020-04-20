import { FabrixGeneric } from '@fabrix/fabrix/dist/common'
import { FabrixApp } from '@fabrix/fabrix'
import { BroadcastEntity } from './BroadcastEntity'
import { Broadcast } from './Broadcast'
import { BroadcastCommand } from './BroadcastCommand'

/**
 * @module Hook
 * @description Hook
 */
export class BroadcastHook extends FabrixGeneric {
  public app: FabrixApp
  public options
  public command
  public lifecycle = 'before'
  public handler
  public broadcaster

  public message

  public isAcknowledged: boolean
  public isCancelled: boolean
  private _id

  constructor(
    app: FabrixApp, {
      command,
      options,
      lifecycle,
      handler,
      broadcaster
  }: {
      command: BroadcastCommand,
      options: {[key: string]: any},
      lifecycle?: string,
      handler?: {[key: string]: any},
      broadcaster?: Broadcast
  }) {
    super(app)

    this.command = command
    this.options = options
    this.lifecycle = lifecycle || this.lifecycle
    this.handler = handler
    this.broadcaster = broadcaster

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
    throw new Error(`${this.name}.run must override Hook.run`)
  }
  async cancel (): Promise<any> {
    // throw new Error(`${this.name}.cancel must override Hook.cancel`)
    return Promise.resolve([this.command, this.options])
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
      return this.app.broadcastSeries(...args)
    }
    else {
      // return broadcastSeries(...args)
      throw new Error('Spool Sequelize is not yet loaded')
    }
  }
}


export class BroadcastHookIn extends BroadcastEntity {
  private _handlers: Map<string, string> = new Map()

  constructor(app: FabrixApp) {
    super(app, 'hooks')
  }

  /**
   * Returns the BroadcastHandlers
   */
  get handlers() {
    return this._handlers
  }
  hasHandler(name) {
    return this._handlers.has(name)
  }
}
