import { FabrixModel as Model} from '@fabrix/fabrix/dist/common'
import uuid from 'uuid/v4'
import { Type } from '../../binary'
import { BroadcastModelResolver } from '../../BroadcastModel'



/**
 * @module BroadcastHook
 * @description BroadcastEventHook
 */
export class BroadcastEventHook extends Model {

  static get resolver() {
    return BroadcastModelResolver
  }

  static config (app, Sequelize) {
    return {
      options: {
        underscored: true,
        updatedAt: false,
        indexes: [
          {
            name: 'broadcast_event_hook_index',
            fields: ['event_uuid', 'hook_type', 'url']
          }
        ]
      }
    }
  }

  static schema (app, Sequelize) {
    return {
      // ID
      event_uuid: {
        type: Sequelize.UUID,
        primaryKey: true,
        binaryOptional: false,
        binaryType: 'string'
      },
      hook_type: {
        type: Sequelize.ENUM,
        values: ['pre', 'post', 'web'],
        primaryKey: true,
        binaryOptional: false,
        binaryType: 'string'
      },
      url: {
        type: Sequelize.STRING,
        binaryOptional: true,
        binaryType: 'string'
      },
      attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        binaryOptional: false,
        binaryType: 'int'
      },
      status: {
        type: Sequelize.ENUM,
        values: ['pending', 'delivered', 'cancelled'],
        binaryOptional: true,
        binaryType: 'string'
      },
      live_mode: {
        type: Sequelize.BOOLEAN,
        defaultValue: app.config.get('platform.live_mode'),
        binaryOptional: true,
        binaryType: 'boolean'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        binaryOptional: false,
        binaryType: 'date'
      }
    }
  }

  /**
   * Associate the Model
   * @param models
   */
  public static associate (models) {

  }
}
