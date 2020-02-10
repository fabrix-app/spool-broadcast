import { FabrixApp } from '@fabrix/fabrix'
import { FabrixGeneric, FabrixModel } from '@fabrix/fabrix/dist/common'
import { mapSeries } from 'bluebird'
import { Broadcast } from './Broadcast'
import { BroadcastEvent } from './api/models'
import {Entry} from './Entry'
// import uuid from 'uuid/v4'

import { BroadcastAction, BroadcastOptions, IBroadcastTuple } from './Interface'
import { BroadcastEntity } from './BroadcastEntity'

export class BroadcastProject extends FabrixGeneric {
  public message: any
  public isAcknowledged: boolean
  public isRedelivered = false
  public consistency = 'strong'
  private _id: string

  constructor(
    app: FabrixApp,
    public event: BroadcastEvent,
    public options: {[key: string]: any},
    consistency?: string,
    message?: string,
    public manager?: any
  ) {
    super(app)
    this.event = event
    this.options = options
    this.consistency = consistency || this.consistency

    this.message = message
    this.manager = manager

    this.id = this.event.event_uuid
    this.isAcknowledged = false


    if (this.message && this.message.fields) {
      this.isRedelivered = this.message.fields.redelivered
    }
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

  async run (): Promise<(BroadcastEvent | BroadcastAction | BroadcastOptions)[]> {
    throw new Error('Subclasses must override BroadcastProject.run')
  }

  /**
   * Acknowledge the event
   */
  async ack(): Promise<(BroadcastEvent | BroadcastAction | BroadcastOptions)[]> {
    if (!this.isAcknowledged && this.message) {
      this.isAcknowledged = true
      return this.message.ack()
        // .then(() => {
        //   return Promise.resolve([this.event, this.options])
        // })
    }
    else if (!this.isAcknowledged && !this.message) {
      this.isAcknowledged = true
      return Promise.resolve([this.event, this.options])
    }
    else {
      this.app.log.warn(`Projector ${this.name} attempting to ack a message that already responded`)
      return Promise.resolve([this.event, this.options])
    }
  }

  /**
   * Don't Acknowledge the event
   */
  async nack(): Promise<(BroadcastEvent | BroadcastAction | BroadcastOptions)[]> {
    if (!this.isAcknowledged && this.message) {
      this.app.log.debug(`Nacking ${this.name}`)
      this.isAcknowledged = true
      return this.message.nack()
        // .then(() => {
        //   return Promise.reject([this.event, this.options])
        // })
    }
    else if (!this.isAcknowledged && !this.message) {
      this.app.log.debug(`Can not nack empty message for Projector ${this.name}`)
      this.isAcknowledged = true
      return Promise.reject([this.event, this.options])
    }
    else {
      this.app.log.warn(`Projector ${this.name} attempting to nack a message that already responded`)
      return Promise.reject([this.event, this.options])
    }
  }

  /**
   * Reject the event
   */
  async reject(): Promise<(BroadcastEvent | BroadcastAction | BroadcastOptions)[]> {
    if (!this.isAcknowledged && this.message) {
      this.app.log.debug(`Rejecting ${this.name}`)
      this.isAcknowledged = true
      return this.message.reject()
        // .then(() => {
        //   return Promise.reject([this.event, this.options])
        // })
    }
    else if (!this.isAcknowledged && !this.message) {
      this.app.log.debug(`Can not reject empty message for ${this.name}`)
      this.isAcknowledged = true
      return Promise.reject([this.event, this.options])
    }
    else {
      this.app.log.warn(`${this.name} attempting to reject a message that already responded`)
      return Promise.reject([this.event, this.options])
    }
  }

  /**
   * Interrupt the event
   */
  async interrupt (msg): Promise<any> {
    this.app.log.debug(`${this.name} Interrupt:`, msg)
  }

  /**
   * Cleanup any artifacts
   * @param results
   */
  async finalize (results?): Promise<any> {
    this.app.log.debug(`${this.name} Finalize:`, results)
  }

  public entries(name): Entry {
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
  public mapSeries(...args): Promise<any> {
    return this.app.broadcastSeries(...args)
  }

  get metadata(): { channel, channel_session, user, device, application, causation_uuid } {
    const channel = { channel_uuid: this.event.metadata.req_channel_uuid || null }
    const channel_session = { session_uuid: this.event.metadata.req_session_uuid  || null }
    const user = { user_uuid: this.event.metadata.req_user_uuid }
    const device = { device_uuid: this.event.metadata.req_device_uuid || null }
    const application = { application_uuid: this.event.metadata.req_application_uuid || null }
    const causation_uuid = this.event.event_uuid || null

    return {
      channel,
      channel_session,
      user,
      device,
      application,
      causation_uuid
    }
  }
}

export class BroadcastProjector extends BroadcastEntity {
  private _managers: Map<string, string> = new Map()

  constructor(app: FabrixApp) {
    super(app, 'projectors')
  }

  /**
   * Returns the BroadcastManagers
   */
  get managers() {
    return this._managers
  }
  hasManager(name) {
    return this._managers.has(name)
  }
}
