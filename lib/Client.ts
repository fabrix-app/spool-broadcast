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
   * Publish's Broadcast Event
   */
  async publish ({broadcaster, event_type, event, options, consistency, manager}: {
    broadcaster: Broadcast,
    event_type: string,
    event: BroadcastEvent,
    options?: {[key: string]: any},
    consistency?: string,
    manager?: any
  }) {
    // RabbitMQ can route events if they have a color ":", or other reserved characters
    // which means, for this use case we need to sanatize the event type for Broadcast pattern matching
    const safe_event_type = event_type.replace(/:/g, '_')

    const routingKey = broadcaster.name
    const correlationId = event.correlation_uuid
    const connectionName = null
    const sequenceNo = null
    const expiresAfter = manager ? manager.expires_after : null
    const persistent = manager ? manager.persistent : null
    const mandatory = manager ? manager.mandatory : null
    const timeout = manager ? manager.timeout : this.app.config.get('broadcast.default_publish_timeout')

    this.app.log.debug('publishing safe_event_type', safe_event_type)

    const send: {[key: string]: any} = {
      type: safe_event_type, // type
      body: event, // message,
      routingKey,
      correlationId,
      headers: {
        causation_uuid: event.causation_uuid
      },
      sequenceNo
    }

    // Set the Manger's Expires After
    if (expiresAfter !== null) {
      send.expiresAfter = expiresAfter
    }
    // Set the Manager's Persistent
    if (persistent !== null) {
      send.persistent = persistent
    }
    // Set the Manager's Mandatory
    if (mandatory !== null) {
      send.mandatroy = mandatory
    }
    // Set the Manager's timeout
    if (timeout !== null) {
      send.timeout = timeout
    }

    // Attempt to convert this event from BroadcastEvent to JSON
    try {
      event.toJSON()
    }
    catch (err) {
      this.app.log.error('Unhandled - Unable to publish to messenger', event_type, err)
      return [event, options]
    }

    // Publish this on Rabbit MQ
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
   * Cancels Broadcast Event
   */
  async cancel (event_type, event_uuid) {
    this.app.log.info(
      'cancelling type',
      event_type,
      event_uuid,
      this.exchange_name
    )

    // RabbitMQ can route events if they have a color ":", or other reserved characters
    // which means, for this use case we need to sanatize the event type for Broadcast pattern matching
    const safe_event_type = event_type.replace(/:/g, '_')

    return this.messenger.publish(
      this.exchange_name,
      `${safe_event_type}.interrupt`,
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
