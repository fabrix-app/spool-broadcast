import { FabrixApp } from '@fabrix/fabrix'
import { FabrixGeneric } from '@fabrix/fabrix/dist/common'

import { BroadcastEvent } from './api/models'
import { Entry } from './Entry'
import { BroadcastAction, BroadcastOptions } from './Interface'
import { BroadcastEntity } from './BroadcastEntity'

export class BroadcastProcess extends FabrixGeneric {
  public message: any
  public isAcknowledged: boolean
  public isRedelivered = false
  public consistency = 'strong'
  public versions = [1]
  private _id: string

  constructor(
    app: FabrixApp,
    public event: BroadcastEvent,
    public options: BroadcastOptions,
    consistency?: string,
    message?: string,
    public manager?
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
    if (!this.isAcknowledged) {
      this.isAcknowledged = true
      if (this.message) {
        return this.message.ack()
          // .then(() => {
          //   return [this.event, this.options]
          // })
          // .catch(err => {
          //   this.app.log.warn(`Processor ${this.name} attempting to ack a message, but failed!`, err)
          //   return [this.event, this.options]
          // })
      }
      else {
        return Promise.resolve([this.event, this.options])
      }
    }
    else {
      this.app.log.warn(`Processor ${this.name} attempting to ack a message that already responded`)
      return Promise.resolve([this.event, this.options])
    }
  }

  /**
   * Don't Acknowledge the event
   */
  async nack(): Promise<(BroadcastEvent | BroadcastAction | BroadcastOptions)[]> {
    if (!this.isAcknowledged) {
      this.isAcknowledged = true
      if (this.message) {
        return this.message.nack()
          // .then(() => {
          //   return Promise.reject([this.event, this.options])
          // })
          // .catch(err => {
          //   this.app.log.warn(`Processor ${this.name} attempting to nack a message, but failed!`, err)
          //   return [this.event, this.options]
          // })
      }
      else {
        return Promise.resolve([this.event, this.options])
      }
    }
    else {
      this.app.log.warn(`${this.name} attempting to nack a message that already responded`)
      return Promise.resolve([this.event, this.options])
    }
  }

  /**
   * Reject the event
   */
  async reject(): Promise<(BroadcastEvent | BroadcastAction | BroadcastOptions)[]> {
    if (!this.isAcknowledged) {
      this.isAcknowledged = true
      if (this.message) {
        return this.message.reject()
          // .then(() => {
          //   return Promise.reject([this.event, this.options])
          // })
      }
      else {
        return Promise.resolve([this.event, this.options])
      }
    }
    else {
      this.app.log.warn(`${this.name} attempting to reject a message that already responded`)
      return Promise.resolve([this.event, this.options])
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
   * @param event
   * @param options
   */
  async finalize (): Promise<any> {
    this.app.log.debug(`${this.name} Finalize:`, this.event.event_type)
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

  get metadata(): { channel, channel_session, user, device, application, causation_uuid, ip } {
    try {
      const channel = { channel_uuid: this.event.metadata.req_channel_uuid || null }
      const channel_session = { session_uuid: this.event.metadata.req_session_uuid  || null }
      const user = { user_uuid: this.event.metadata.req_user_uuid }
      const device = { device_uuid: this.event.metadata.req_device_uuid || null }
      const application = { application_uuid: this.event.metadata.req_application_uuid || null }
      const causation_uuid = this.event.event_uuid || null
      const ip = { ip: this.event.metadata.req_ip || null }

      return {
        channel,
        channel_session,
        user,
        device,
        application,
        causation_uuid,
        ip
      }
    }
    catch (err) {
      this.app.log.error(`${this.name} metadata is incorrect`, err)
      throw new Error(err)
    }
  }
}

export class BroadcastProcessor extends BroadcastEntity {
  private _managers: Map<string, string> = new Map()

  constructor(app: FabrixApp) {
    super(app, 'processors')
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
