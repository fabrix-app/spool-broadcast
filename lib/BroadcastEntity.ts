import { FabrixGeneric as Generic } from '@fabrix/fabrix/dist/common'
import { Broadcast } from './Broadcast'
import { FabrixApp } from '@fabrix/fabrix'

export class BroadcastEntity extends Generic {
  private _broadcasters: Map<string, Broadcast> = new Map()
  private _protectedMethods = ['getBroadcaster', 'addBroadcaster', 'removeBroadcaster', 'hasBroadcaster']

  constructor(app: FabrixApp, public _type) {
    super(app)

    const broadcasters = Object.keys(
      this.app.config.get(`broadcast.${this._type}.${this.name}.broadcasters`)
      || {}
    )

    // this._broadcasters =
    broadcasters.forEach((k) => {
      if (k && this.app.broadcasts[k]) {
        this.addBroadcaster(this.app.broadcasts[k])
      }
      else {
        this.app.log.error(
          `Attempting to register broadcast ${ k } on ${this._type} ${this.name},`,
          `but ${k} was not found in api/broadcasts`
        )
      }
    })
  }

  get type() {
    return this._type
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
