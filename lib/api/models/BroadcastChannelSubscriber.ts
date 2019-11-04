import { FabrixModel } from '@fabrix/fabrix/dist/common'
import { BroadcastResolver } from '../../BroadcastResolver'

export class BroadcastChannelSubscriberResolver extends BroadcastResolver {

}

/**
 * @module BroadcastSnapshot
 * @description
 */
export class BroadcastChannelSubscriber extends FabrixModel {

  static get resolver() {
    return BroadcastChannelSubscriberResolver
  }

  static config(app, Sequelize) {
    return {
      options: {
        underscored: true,
        updatedAt: false,
        primaryKey: false,
        indexes: [
          {
            name: 'broadcast_channel_subscriber_index',
            fields: ['event_type', 'channel']
          }
        ]
      }
    }
  }

  static schema(app, Sequelize) {
    return {
      // ID
      spark_id: {
        type: Sequelize.STRING,
        binaryOptional: false,
        binaryType: 'string'
      },
      event_type: {
        type: Sequelize.STRING,
        binaryOptional: false,
        binaryType: 'string'
      },
      channel: {
        type: Sequelize.STRING,
        binaryOptional: false,
        binaryType: 'string'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        binaryOptional: false,
        binaryType: 'date'
      }
    }
  }
}
