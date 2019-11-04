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
    broker?
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
    // throw new Error('Subclasses must override BroadcastProject.run')
    return Promise.resolve(this)
  }

  async publish (): Promise<BroadcastSubscriber> {
    const json = this.event.toJSON()
    // throw new Error('Subclasses must override BroadcastProject.run')

    console.log('brk SPARK publish 1', this.event.pattern_raw, json)

    return this.channel.getSubscribers(this.event)
      .then(subscribers => {
        this.app.log.debug(`${this.channel.name}.${this.event.pattern_raw} has ${subscribers.length} subscribers listening`)

        if (subscribers.length > 0) {

          console.log('brk SPARK publish 2', this.event.pattern_raw, subscribers)

          this.channel.channel.forEach(function (spark, id, connections) {
            console.log('brk SPARK publish 3', spark, id)
            if (subscribers.find(s => s.spark_id === id)) {
              console.log('brk SPARK publish 4', spark, id)
              spark.write(json)
            }
          })
        }
        return this
      })
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

  // get subscribers() {
  //   return this._channel.
  // }

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
  initialize() {
    this.channel.on('connection', (spark) => {

      spark.write(`BRK SPARK welcome from ${this.name} ${spark.id}!`)

      spark.on('data', (data) => {
        if (data.subscribe && isArray(data.subscribe)) {
          this.addSubscriptions(spark, data.subscribe)
            .then(res => {
              spark.write({ subscribed: data.subscribe })
            })
            .catch(err => {
              spark.write({ error: err })
            })
        }
        else if (data.unsubscribe && isArray(data.unsubscribe)) {
          this.removeSubscriptions(spark, data.unsubscribe)
            .then(res => {
              spark.write({ unsubscribed: data.unsubscribe })
            })
            .catch(err => {
              spark.write({ error: err })
            })
        }
        else {
          console.log('Spark writing to a subscribe/unsubscribe only')
          spark.write({ error: 'This channel only supports the subscribe/unsubscribe method' })
        }
      })

      spark.on('disconnection', (data) => {
        this.disconnect(spark, data)
      })
    })
    // throw new Error(`${this.name}.initialize should be overridden by subclass!`)
  }

  async addSubscriptions(spark, subscriptions = []) {
    const subs = subscriptions.map(s => {
      return {
        spark_id: spark.id,
        event_type: s,
        channel: this.name
      }
    })
    return this.app.models.BroadcastChannelSubscriber.bulkCreate(subs)
  }

  async removeSubscriptions(spark, subscriptions) {
    const subs = subscriptions.map(s => {
      return {
        spark_id: spark.id,
        event_type: s,
        channel: this.name
      }
    })

    return this.app.models.BroadcastChannelSubscriber.destroy({
      where: subs
    })
  }

  async getSubscribers(event) {

    // Add the raw to the query
    const queryOr = new Set([event.pattern_raw])
    let built = event.pattern_raw

    // Grab the keys to build the OR query
    const { pattern, keys } = regexdot(event.pattern_raw)

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
          const singleParam = (`${event.pattern_raw}`).replace(`:${k}`, `${compare[k]}`)
          queryOr.add(singleParam)
        }
      })
    }

    const query: {[key: string]: any} = {
      channel: this.name,
      event_type: Array.from(queryOr)
    }

    return this.app.models.BroadcastChannelSubscriber.findAll({
      where: query
    })
  }

  connect(spark) {
    return
  }

  async disconnect(spark, data) {
    console.log('BRK SPARK subscriber going away', spark.id, data)

    return this.app.models.BroadcastChannelSubscriber.destroy({
      where: {
        spark_id: spark.id,
        channel: this.name
      }
    })
  }


  /**
   * Destroys the Channel and all connections to it
   */
  destroy() {
    this.channel.destroy()
  }
}
