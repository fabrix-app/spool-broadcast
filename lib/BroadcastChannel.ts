import { FabrixApp } from '@fabrix/fabrix'
import { FabrixGeneric } from '@fabrix/fabrix/dist/common'
import { Broadcast } from './Broadcast'

export class BroadcastSubscriber {
  public event
  public options
  public broker
  public isAcknowledged

  constructor(public app: FabrixApp, event, options, broker) {
    this.app = app
    this.event = event
    this.options = options
    this.broker = broker

    this.isAcknowledged = false
  }

  get name() {
    return this.constructor.name
  }

  // async run (): Promise<any> {
  //   throw new Error('Subclasses must override BroadcastProject.run')
  // }

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

  hasBroadcaster (broadcaster: Broadcast) {
    return this.broadcasters.has(broadcaster.name)
  }

  get broadcasters () {
    return this._broadcasters
  }

  set broadcasters (broadcasters) {
    throw new Error(`Can not map broadcasters through this method`)
  }

  initialize() {
    // this.channel.write('BRK Hello World!')
    this.channel.on('connection', (spark) => {
      spark.write(`BRK welcome from ${this.name}!`)
    })
    // throw new Error(`${this.name}.initialize should be overridden by subclass!`)
  }
}
