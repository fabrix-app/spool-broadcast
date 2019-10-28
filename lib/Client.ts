import { FabrixApp } from '@fabrix/fabrix'
import { FabrixGeneric } from '@fabrix/fabrix/dist/common'
import { BroadcastEvent } from './api/models'
import { Broadcast } from './Broadcast'

export class Client extends FabrixGeneric {
  public messenger
  public exchange_name
  public active_broadcasts

  constructor (app: FabrixApp, messenger, exchangeName) {
    super(app)

    app.log.debug('Rabbit Client created', exchangeName)

    this.messenger = messenger
    this.exchange_name = exchangeName
    this.active_broadcasts = new Map()
  }

  /**
   * Publish
   */
  async publish ({broadcaster, event_type, event, options, consistency, manager}: {
    broadcaster: Broadcast,
    event_type: string,
    event: BroadcastEvent,
    options?: {[key: string]: any},
    consistency?: string,
    manager?: any
  }) {
    const routingKey = broadcaster.name
    const correlationId = event.correlation_uuid
    const connectionName = null
    const sequenceNo = null
    const expiresAfter = manager ? manager.expires_after : null
    const persistent = manager ? manager.persistent : null
    const mandatory = manager ? manager.mandatory : null
    const timeout = manager ? manager.timeout : this.app.config.get('broadcast.default_publish_timeout')

    const send: {[key: string]: any} = {
      type: event_type, // type
      body: event, // message,
      routingKey,
      correlationId,
      headers: {
        causation_uuid: event.causation_uuid
      },
      sequenceNo
    }

    if (expiresAfter !== null) {
      send.expiresAfter = expiresAfter
    }
    if (persistent !== null) {
      send.persistent = persistent
    }
    if (mandatory !== null) {
      send.mandatroy = mandatory
    }
    if (timeout !== null) {
      send.timeout = timeout
    }

    try {
      event.toJSON()
    }
    catch (err) {
      this.app.log.error('Unhandled - Unable to publish to messenger', event_type, err)
      return [event, options]
    }

    return this.messenger.publish(
      this.exchange_name,
      send,
      connectionName
    )
      .then(() => {
        return [event, options]
      })
  }

  /**
   * Cancel Broadcast
   */
  async cancel (event_type, event_uuid) {
    this.app.log.info(
      'cancelling type',
      event_type,
      event_uuid,
      this.exchange_name
    )

    return this.messenger.publish(
      this.exchange_name,
      `${event_type}.interrupt`,
      { event_uuid }
    )
      .then((result) => {
        return result
      })
      .catch(err => {
        this.app.log.error(err)
        return err
      })
  }

}
