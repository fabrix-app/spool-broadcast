import { FabrixApp } from '@fabrix/fabrix'
import { FabrixGeneric, FabrixModel } from '@fabrix/fabrix/dist/common'
import { Promise } from 'bluebird'
import { isArray } from 'lodash'
import { BroadcastEvent } from './api/models'
import { Entry } from './Entry'
import { BroadcastAction, BroadcastOptions } from './Interface'
import { BroadcastEntity } from './BroadcastEntity'
import { Broadcast } from './Broadcast'
import { regexdot } from '@fabrix/regexdot'


export class BroadcastDispatch extends FabrixGeneric {
  public event: BroadcastEvent
  public options: {[key: string]: any}
  public consistency = 'strong'
  public manager: {[key: string]: any}
  public broadcaster: Broadcast

  public message: any
  public isAcknowledged = false
  public isRedelivered = false

  public versions = [1]
  public retries = 0
  public dispatcherModel: FabrixModel
  private _id: string

  constructor(
    app: FabrixApp, {
      event,
      options,
      consistency,
      message,
      manager,
      broadcaster
    }: {
      event: BroadcastEvent,
      options: BroadcastOptions,
      consistency?: string,
      message?: string,
      manager?,
      broadcaster?: Broadcast
    }) {
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
   * Broadcast the new Event
   * @param events
   */
  async broadcast (events) {
    if (!events) {
      throw new Error('Broadcast.broadcast missing event')
    }
    if (isArray(events)) {
      return this.app.broadcastSeries(events, (event) => {
        return this.broadcaster.broadcast(event, this.options)
      })
        .then((results) => {
          return [results.map(e => e[0]), results.map(e => e[1])]
        })
    }
    else {
      return this.broadcaster.broadcast(events, this.options)
    }
  }

  /**
   * Generate new Event
   * @param event_type
   * @param object
   * @param data
   * @param metadata
   */
  generateEvent (event_type, object?, data?, metadata?): BroadcastEvent {

    if (!event_type || !this.event.event_type) {
      throw new Error('Broadcast.generateEvent missing event_type')
    }
    if (!(this.event instanceof this.app.models.BroadcastEvent.instance)) {
      throw new Error('Broadcast.buildProjection called with a non Event object')
    }

    // Make a JOSN version of the event
    const __event = this.event.toJSON()

    const { keys, pattern } = regexdot(event_type)

    // Create the data for the Event Model
    const _event = {
      // This is the command uuid that started this event chain
      correlation_uuid: __event.correlation_uuid,
      // This is the REGEX pattern that the command used
      correlation_pattern: __event.correlation_pattern,
      // This is the string pattern that the command used
      correlation_pattern_raw: __event.correlation_pattern_raw,
      // The causation_uuid my have been part of a another new event (processor dispatched)
      causation_uuid: __event.event_uuid, // __event.causation_uuid,
      // // report list of functions that ran before this event's saga (combined)
      chain_before: [], // __event.chain_before,
      // // report list of functions that ran during this event's saga (combined)
      chain_saga: [], // __event.chain_saga,
      // // report list of functions that ran after this event's saga (combined)
      chain_after: [], // __event.chain_after,

      chain_events: [], // __event.chain_before,
      // // report list of functions that ran before this event's saga (combined)
      // chain_events: __event.chain_events,
      // The event_type that can override the command event_type
      event_type: event_type, // The new Event Type,
      // the event_type REGEX pattern
      pattern: pattern,
      // the event_type string pattern
      pattern_raw: event_type,

      version: __event.version,

      object: object || __event.object, // We can use the original event's object here
      data: data || __event.data,
      metadata: metadata || __event.metadata,
      is_projection: false,
      is_dispatch: true
    }

    // return _event
    // Stage the Event as a new BroadcastEvent ready to be run
    return this.app.models.BroadcastEvent.stage(_event, {
      isNewRecord: this.options.isNewRecord
    }).generateUUID()
  }

  /**
   * Make a Dispatcher Request and validate the response based off the manager provided
   * @param req
   */
  async request (req): Promise<any> {
    return req
      .then(([event, options]) => {
        // If a manager was passed
        if (this.manager && this.manager.expects_response) {
          // If this is strict
          if (
            typeof this.manager.expects_response === 'string'
            && event.getDataValue('object') !== this.manager.expects_response
            && this.manager.expects_response !== '*'
          ) {
            throw new Error(
`${this.name} expected ${this.manager.expects_response}
but got ${event.getDataValue('object')} for ${event.event_type}`
            )
          }
          // if this is one of accepted response objects
          else if (
            Array.isArray(this.manager.expects_response)
            && this.manager.expects_response.indexOf(event.getDataValue('object')) === -1
          ) {
            throw new Error(
`${this.name} expected ${this.manager.expects_response.join(', ')}
but got ${event.getDataValue('object')} for ${event.event_type}`
            )
          }
        }
        return [event, options]
      })
  }

  /**
   * Acknowledge the event
   */
  async ack(): Promise<(BroadcastEvent | BroadcastAction | BroadcastOptions)[]> {
    if (!this.isAcknowledged) {
      this.isAcknowledged = true
      if (this.message) {
        return new Promise((resolve, reject) => {
          return resolve(this.message.ack())
        })
          .then(() => {
            return [this.event, this.options]
          })
          .catch((err) => {
            this.app.log.error(`Dispatcher ${this.name} failed on ack`, err)
            return [this.event, this.options]
          })
          // .catch(err => {
          //   this.app.log.warn(`Dispatcher ${this.name} attempting to ack a message, but failed!`, err)
          //   return [this.event, this.options]
          // })
      }
      else {
        return Promise.resolve([this.event, this.options])
      }
    }
    else {
      this.app.log.warn(`Dispatcher ${this.name} attempting to ack a message that already responded`)
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
          // .catch(err => {
          //   this.app.log.warn(`Dispatcher ${this.name} attempting to nack a message, but failed!`, err)
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

  get metadata(): { channel, channel_session, user, device, application, causation_uuid, correlation_uuid, ip } {
    try {
      const channel = { channel_uuid: this.event.metadata.req_channel_uuid || null }
      const channel_session = { session_uuid: this.event.metadata.req_session_uuid  || null }
      const user = { user_uuid: this.event.metadata.req_user_uuid }
      const device = { device_uuid: this.event.metadata.req_device_uuid || null }
      const application = { application_uuid: this.event.metadata.req_application_uuid || null }
      const causation_uuid = this.event.event_uuid || null
      const correlation_uuid = this.event.correlation_uuid || null
      const ip = {ip: this.event.metadata.req_ip || null }

      return {
        channel,
        channel_session,
        user,
        device,
        application,
        causation_uuid,
        correlation_uuid,
        ip
      }
    }
    catch (err) {
      this.app.log.error(`${this.name} metadata is incorrect`, err)
      throw new Error(err)
    }
  }
}

export class BroadcastDispatcher extends BroadcastEntity {
  private _managers: Map<string, string> = new Map()

  constructor(app: FabrixApp) {
    super(app, 'dispatchers')
  }

  newDispatcher(func, vals): BroadcastDispatch {
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
