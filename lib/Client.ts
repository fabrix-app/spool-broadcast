import { FabrixApp } from '@fabrix/fabrix'
import { FabrixGeneric } from '@fabrix/fabrix/dist/common'
import { BroadcastEvent } from './api/models'
import { Broadcast } from './Broadcast'
import { omit } from 'lodash'

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
    const safe_event_type = event_type
      .replace(/:/g, '_')
      .replace(/\*/g, '_all')

    this.app.log.debug('publishing safe_event_type', safe_event_type)

    const routingKey = broadcaster.name
    const correlationId = event.correlation_uuid
    const connectionName = manager.connection_name ? manager.connection_name : null
    const sequenceNo = manager.squence_number ? manager.squence_number : null
    const expiresAfter = manager ? manager.expires_after : null
    const persistent = manager ? manager.persistent : null
    const mandatory = manager ? manager.mandatory : null
    const timeout = manager ? manager.timeout : this.app.config.get('broadcast.default_publish_timeout')

    const send: {[key: string]: any} = {
      type: safe_event_type, // type
      routingKey,
      correlationId,
      headers: {
        causation_uuid: event.causation_uuid
      },
      sequenceNo
    }

    // Attempt to convert this event from BroadcastEvent to JSON
    // If it fails, then it can not be published to the client
    try {
      // Omit the build info to keep the size of the message down
      send.body = omit(event.toJSON(), [
        '_data',
        '_metadata',
        '_object'
      ])
    }
    catch (err) {
      this.app.log.error('Broadcaster: Unhandled error, unable to publish to messenger', event_type, err)
      return [event, options]
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
    // Set the Manager's sequenceNo
    if (sequenceNo !== null) {
      send.sequenceNo = sequenceNo
    }

    // Publish this on Rabbit MQ
    return this.messenger.publish(
      this.exchange_name,
      send,
      connectionName
    )
      .then((res) => {
        return [event, options]
      })
      // .then(
      //   (res) => {
      //     console.log('brk res', res)
      //     return [event, options]
      //   }, // a list of the messages of that succeeded,
      //   failed => {
      //     console.log('brk res fail', failed)
      //     return [event, options]
      //   } // a list of failed messages and the errors `{ err, message }`
      // )
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

    // RabbitMQ can route events if they have a colon ":", or other reserved characters
    // which means, for this use case we need to sanatize the event type for Broadcast pattern matching
    const safe_event_type = event_type
      .replace(/:/g, '_')
      .replace(/\*/g, '_all')

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


  /**
   * Moves Broadcast Event to poison queue
   */
  async poison (event_type, event_uuid) {
    this.app.log.info(
      'poison type',
      event_type,
      event_uuid,
      this.exchange_name
    )

    // RabbitMQ can route events if they have a colon ":", or other reserved characters
    // which means, for this use case we need to sanatize the event type for Broadcast pattern matching
    const safe_event_type = event_type
      .replace(/:/g, '_')
      .replace(/\*/g, '_all')

    return this.messenger.publish(
      this.exchange_name,
      `${safe_event_type}.poison`,
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
