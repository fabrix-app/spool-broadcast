import { FabrixApp } from '@fabrix/fabrix'
import { FabrixGeneric, FabrixModel } from '@fabrix/fabrix/dist/common'
import { mapSeries } from 'bluebird'
import { Broadcast } from './Broadcast'
import { BroadcastEvent } from './api/models'
import { Entry } from './Entry'
// import uuid from 'uuid/v4'
import { BroadcastAction, BroadcastOptions } from './Interface'

export class BroadcastProcess extends FabrixGeneric {
  public message: any
  public isAcknowledged: boolean
  public consistency = 'strong'
  public versions = [1]
  private _id: string

  constructor(
    app: FabrixApp,
    public event: BroadcastEvent,
    public options: BroadcastOptions,
    public manager?
  ) {
    super(app)

    this.event = event
    this.options = options
    this.manager = manager

    this.id = this.event.event_uuid
    this.isAcknowledged = false
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
      return Promise.resolve([this.event, this.options])
    }
    else {
      this.app.log.warn(`${this.name} attempting to ack a message that already responded`)
      return Promise.resolve([this.event, this.options])
    }
  }

  /**
   * Don't Acknowledge the event
   */
  async nack(): Promise<(BroadcastEvent | BroadcastAction | BroadcastOptions)[]> {
    if (!this.isAcknowledged) {
      this.isAcknowledged = true
      return Promise.reject([this.event, this.options])
    }
    else {
      this.app.log.warn(`${this.name} attempting to nack a message that already responded`)
      return Promise.reject([this.event, this.options])
    }
  }

  /**
   * Reject the event
   */
  async reject(): Promise<(BroadcastEvent | BroadcastAction | BroadcastOptions)[]> {
    if (!this.isAcknowledged) {
      this.isAcknowledged = true
      return Promise.reject([this.event, this.options])
    }
    else {
      this.app.log.warn(`${this.name} attempting to reject a message that already responded`)
      return Promise.reject([this.event, this.options])
    }
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

export class BroadcastProcessor extends FabrixGeneric {

  private _broadcasters: Map<string, Broadcast> = new Map()
  private _managers: Map<string, string> = new Map()

  private _protectedMethods = ['getBroadcaster', 'addBroadcaster', 'removeBroadcaster', 'hasBroadcaster']

  constructor(app: FabrixApp) {
    super(app)
    const broadcasters = Object.keys(
      this.app.config.get(`broadcast.projectors.${this.name}.broadcasters`)
      || {}
    )

    // this._broadcasters =
    broadcasters.forEach((k) => {
      if (k && this.app.broadcasts[k]) {
        this.addBroadcaster(this.app.broadcasts[k])
      }
      else {
        this.app.log.error(`Attempting to register broadcast ${ k } on projector ${this.name}, but ${k} was not found in api/broadcasts`)
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

  /**
   * Returns the BroadcastSubsribers
   */
  get managers() {
    return this._managers
  }
  hasManager(name) {
    return this._managers.has(name)
  }
}
