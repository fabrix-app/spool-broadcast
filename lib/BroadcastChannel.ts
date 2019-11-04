import { FabrixApp } from '@fabrix/fabrix'
import { FabrixGeneric } from '@fabrix/fabrix/dist/common'
import { Broadcast } from './Broadcast'

import { isArray } from 'lodash'
import { regexdot } from '@fabrix/regexdot'
import { BroadcastEvent } from './api/models'
import { __await } from 'tslib'

export interface BroadcastSubscriberParams {
  app: FabrixApp
  channel: BroadcastChannel
  event: BroadcastEvent
  options: {[key: string]: any}
  broker: {[key: string]: any}
}

export class BroadcastSubscriber {
  public channel: BroadcastChannel
  public event: BroadcastEvent
  public options: {[key: string]: any}
  public broker: {[key: string]: any}
  public isAcknowledged

  constructor(
    public app: FabrixApp,
    channel: BroadcastChannel,
    event: BroadcastEvent,
    options,
    broker
  ) {

    this.app = app
    this.channel = channel
    this.event = event
    this.options = options
    this.broker = broker

    this.isAcknowledged = false
  }

  get name() {
    return this.constructor.name
  }

  async run (): Promise<BroadcastSubscriber> {
    return Promise.resolve(this)
  }

  /**
   * Publishes Event to eligible "rooms"
   */
  async publish (): Promise<BroadcastSubscriber> {
    const json = this.event.toJSON()
    const rooms = this.channel.patterns(this.broker.pattern_raw, this.event)

    rooms.forEach(v => {

      // Bad because this may be or may not be async
      this.app.sockets.room(v).clients((ids = []) => {
        this.app.log.debug(`Publishing ${v} to ${(ids || []).length} subscribers`)
      })

      // Send the JSON to the room
      this.app.sockets.room(v).write(json)
    })

    return Promise.resolve(this)
  }

  // /**
  //  * Acknowledge the event
  //  */
  // async ack(): Promise<any> {
  //   if (!this.isAcknowledged) {
  //     this.isAcknowledged = true
  //     return Promise.resolve([this.event, this.options])
  //   }
  //   else {
  //     this.app.log.warn(`${this.name} attempting to ack a message that already responded`)
  //     return Promise.resolve([this.event, this.options])
  //   }
  // }
  //
  // /**
  //  * Don't Acknowledge the event
  //  */
  // async nack(): Promise<any> {
  //   if (!this.isAcknowledged) {
  //     this.isAcknowledged = true
  //     return Promise.reject([this.event, this.options])
  //   }
  //   else {
  //     this.app.log.warn(`${this.name} attempting to nack a message that already responded`)
  //     return Promise.reject([this.event, this.options])
  //   }
  // }
  //
  // /**
  //  * Reject the event
  //  */
  // async reject(): Promise<any> {
  //   if (!this.isAcknowledged) {
  //     this.isAcknowledged = true
  //     return Promise.reject([this.event, this.options])
  //   }
  //   else {
  //     this.app.log.warn(`${this.name} attempting to reject a message that already responded`)
  //     return Promise.reject([this.event, this.options])
  //   }
  // }
}


export class BroadcastChannel extends FabrixGeneric {

  private _channel
  private _broadcasters: Map<string, Broadcast> = new Map()

  private _subscribers: Map<string, string> = new Map()

  private _protectedMethods = ['getBroadcaster', 'addBroadcaster', 'removeBroadcaster', 'hasBroadcaster']

  public permissions: Map<string, any> = new Map()

  constructor(app: FabrixApp) {
    super(app)

    const broadcasters = Object.keys(
      this.app.config.get(`broadcast.channels.${this.name}.broadcasters`)
      || {}
    )

    // this._broadcasters =
    broadcasters.forEach((k) => {
      if (k && this.app.broadcasts[k]) {
        this.addBroadcaster(this.app.broadcasts[k])
      }
      else {
        this.app.log.error(`Attempting to register broadcast ${ k } on channel ${this.name}, but ${k} was not found in api/broadcasts`)
      }
    })
  }

  /**
   * Returns the name of the BroadcastChannel Class
   */
  get name() {
    return this.constructor.name
  }

  /**
   * Returns the socket channel
   */
  get channel() {
    return this._channel
  }

  /**
   * Returns the BroadcastSubsribers
   */
  get subscribers() {
    return this._subscribers
  }
  hasSubscriber(name) {
    return this._subscribers.has(name)
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

  /**
   * If has Broadcaster
   * @param broadcaster
   */
  hasBroadcaster (broadcaster: Broadcast): boolean {
    return this.broadcasters.has(broadcaster.name)
  }

  // Broadcast Getters and Setters
  get broadcasters () {
    return this._broadcasters
  }
  set broadcasters (broadcasters) {
    throw new Error(`Can not map broadcasters through this method`)
  }

  // Initial Function to run when a Socket connects this BroadcastChannel
  initialize() { }

  /**
   * Returns the possible patterns for an event O(n)
   * @param pattern
   * @param event
   */
  patterns(pattern, event) {
    // Add the raw to the query
    const queryOr = new Set([`${pattern}`])
    let built = pattern

    // Grab the keys to build the OR query
    const { keys } = regexdot(pattern)

    // If the keys are viable
    if (
      keys !== false
      && typeof keys !== 'boolean'
      && isArray(keys)
    ) {
      // If normal object, use it, if an array, grab the first as the basis
      const compare = !isArray(event.data) ? event.data : event.data[0]

      keys.forEach(k => {
        if (k && compare && compare[k]) {
          built = built.replace(`:${k}`, `${compare[k]}`)
          // Add a fully built version
          queryOr.add(built)

          // Add a just replace single param version
          const singleParam = (`${pattern}`).replace(`:${k}`, `${compare[k]}`)
          queryOr.add(singleParam)
        }
      })
    }

    return Array.from(queryOr).map(k => {
      return `${this.name}.${k}`
    })
  }

  /**
   * Called when a spark first joins a room
   * @param spark
   * @param room
   */
  subscribed(spark, room) {
    return
  }
  /**
   * Called when a spark first leaves a room
   * @param spark
   * @param room
   */
  unsubscribed(spark, room) {
    return
  }

  disconnect(spark, data) {
    return
  }


  /**
   * Destroys the Channel and all connections to it
   */
  destroy() {
    // this.channel.destroy()
  }
}
