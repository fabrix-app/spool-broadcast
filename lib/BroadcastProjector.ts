import { FabrixApp } from '@fabrix/fabrix'
import { FabrixGeneric, FabrixModel } from '@fabrix/fabrix/dist/common'
import { mapSeries, Promise } from 'bluebird'
import { Broadcast } from './Broadcast'
import { BroadcastEvent } from './api/models'
import { Entry } from './Entry'
// import uuid from 'uuid/v4'

import { BroadcastAction, BroadcastOptions, IBroadcastTuple } from './Interface'
import { BroadcastEntity } from './BroadcastEntity'
import { intersection } from 'lodash'
import { GenericError } from '@fabrix/spool-errors/dist/errors'

export class BroadcastProject extends FabrixGeneric {

  public event: BroadcastEvent
  public options: {[key: string]: any}
  public consistency = 'strong'
  public manager: {[key: string]: any}
  public broadcaster: Broadcast

  public message: any
  public isAcknowledged = false
  public isRedelivered = false

  public retries = 0
  private _projectorModel: FabrixModel
  private _id: string

  constructor(
    app: FabrixApp,
    {
      event,
      options,
      consistency,
      message,
      manager,
      broadcaster
    }: {
      event: BroadcastEvent,
      options: { [key: string]: any },
      consistency?: string,
      message?: string,
      manager?: any,
      broadcaster?: Broadcast
    }
  ) {
    // Meet the criteria of a Fabrix Generic
    super(app)

    // Assign the event
    this.event = event

    // Combine and Assign Options
    if (manager && manager.options) {
      this.options = Object.assign({}, options, manager.options)
    }
    else {
      this.options = options
    }

    // Assign the manager
    this.manager = manager

    // Assign the consistency
    this.consistency = consistency || this.consistency

    // Assign the broadcaster
    this.broadcaster = broadcaster

    // Give this instance the ID of the event
    this.id = this.event.event_uuid

    // Handle Eventual
    // Assign the Message
    this.message = message

    // Assign the redelivered status
    if (this.message && this.message.fields) {
      this.isRedelivered = this.message.fields.redelivered
    }
  }

  // TODO, we need to handle projections that are not the same type as the event
  get saveOptions () {
    // Get the only the fields that change
    let fields = this.event.changes()

    if (this.projectorModel && this.fields.length > 0) {
      fields = intersection(this.event.changes(), this.fields)
    }
    // Guarantee that we have the schema and then use the intersection for sequelize safety
    // This assumes that the projection is the same model type as the event
    else if (this.event.object && this.event.object.resolver && this.event.object.resolver.schema) {
      fields = intersection(this.event.changes(), Object.keys(this.event.object.resolver.schema))
    }

    return {
      transaction: this.options.transaction,
      useMaster: this.options.useMaster,
      fields: fields
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

  get projectorModel() {
    return this._projectorModel
  }

  get fields(): string[] {
    if (this.projectorModel && this.projectorModel.resolver && this.projectorModel.resolver.schema) {
      return Object.keys(this.projectorModel.resolver.schema)
    }
    else {
      return []
    }
  }

  set projectorModel(model: any) {
    if (typeof model === 'string') {
      if (this.app.models[model]) {
        this._projectorModel = this.app.models[model]
      }
      else {
        throw new GenericError(
          'E_NOT_VALID',
          `${model} is not in app.models`
        )
      }
    }
    else {
      if (this.app.models[model.constructor.name]) {
        this._projectorModel = model
      }
      else {
        throw new GenericError(
          'E_NOT_VALID',
          `${model.constructor.name} is not in app.models`
        )
      }
    }
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

      return new Promise((resolve, reject) => {
        return resolve(this.message.ack())
      })
        .then(() => {
          return [this.event, this.options]
        })
        .catch((err) => {
          this.app.log.error(`Projector ${this.name} failed on ack`, err)
          return [this.event, this.options]
        })
    }
    else if (!this.isAcknowledged && !this.message) {
      this.isAcknowledged = true
      return Promise.resolve([this.event, this.options])
    }
    // else if (this.isAcknowledged && !this.message) {
    //   this.app.log.warn(`Projector ${this.name} attempting to ack a message that already responded`)
    //   return Promise.resolve([this.event, this.options])
    // }
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

      return new Promise((resolve, reject) => {
        return resolve(this.message.nack())
      })
        .then(() => {
          return [this.event, this.options]
        })
        .catch((err) => {
          this.app.log.error(`${this.name} failed on nack`, err)
          return [this.event, this.options]
        })
    }
    else if (!this.isAcknowledged && !this.message) {
      this.app.log.debug(`Can not nack empty message for Projector ${this.name}`)
      this.isAcknowledged = true
      return Promise.resolve([this.event, this.options])
    }
    else if (this.isAcknowledged && this.message) {
      this.app.log.debug(`Can not nack acknowledged message for Projector ${this.name}`)
      this.isAcknowledged = true
      return Promise.resolve([this.event, this.options])
    }
    else {
      this.app.log.warn(`Projector ${this.name} attempting to nack a message that already responded`)
      return Promise.resolve([this.event, this.options])
    }
  }

  /**
   * Reject the event
   */
  async reject(): Promise<(BroadcastEvent | BroadcastAction | BroadcastOptions)[]> {
    if (!this.isAcknowledged && this.message) {
      this.app.log.debug(`Projector Rejecting ${this.name}`)
      this.isAcknowledged = true

      return new Promise((resolve, reject) => {
        return resolve(this.message.reject())
      })
        .then(() => {
          return [this.event, this.options]
        })
        .catch((err) => {
          this.app.log.error(`${this.name} failed on reject`, err)
          return [this.event, this.options]
        })
    }
    else if (!this.isAcknowledged && !this.message) {
      this.app.log.debug(`Can not reject empty message for Projector ${this.name}`)
      this.isAcknowledged = true
      return Promise.resolve([this.event, this.options])
    }
    else if (this.isAcknowledged && this.message) {
      this.app.log.debug(`Can not reject acknowledged message for Projector ${this.name}`)
      return Promise.resolve([this.event, this.options])
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
   * Reply to the event
   */
  async reply (msg): Promise<any> {
    this.app.log.debug(`${this.name} Reply:`, msg)
  }

  /**
   * Cleanup any artifacts
   * @param event
   * @param options
   */
  async finalize (): Promise<any> {
    this.app.log.debug(`${this.name} Finalize:`, this.event.event_type)
  }

  public entries(name: string): Entry {
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

  get metadata(): { channel, channel_session, user, device, application, causation_uuid, correlation_uuid, correlation_type, explain, ip } {

    const channel = { channel_uuid: this.event.metadata.req_channel_uuid || null }
    const channel_session = { session_uuid: this.event.metadata.req_session_uuid  || null }
    const user = { user_uuid: this.event.metadata.req_user_uuid }
    const device = { device_uuid: this.event.metadata.req_device_uuid || null }
    const application = { application_uuid: this.event.metadata.req_application_uuid || null }
    const causation_uuid = this.event.event_uuid || null
    const correlation_uuid = this.event.correlation_uuid || null
    const correlation_type = this.event.correlation_type || null
    const explain = this.event.explain || {}
    const ip = {ip: this.event.metadata.req_ip || null }

    return {
      channel,
      channel_session,
      user,
      device,
      application,
      causation_uuid,
      correlation_uuid,
      correlation_type,
      explain,
      ip
    }
  }
}

export class BroadcastProjector extends BroadcastEntity {
  private _managers: Map<string, string> = new Map()

  constructor(app: FabrixApp) {
    super(app, 'projectors')
  }

  newProjector(func, vals): BroadcastProject {
    return new func(this.app, vals)
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
