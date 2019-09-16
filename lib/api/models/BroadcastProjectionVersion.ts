import { FabrixModel as Model} from '@fabrix/fabrix/dist/common'
import uuid from 'uuid/v4'
import { Type } from 'js-binary'
import { BroadcastModelResolver } from '../../BroadcastModel'



/**
 * @module BroadcastProjectionVersion
 * @description Item Channel Model n:m
 */
export class BroadcastProjectionVersion extends Model {

  static get resolver() {
    return BroadcastModelResolver
  }

  static config (app, Sequelize) {
    return {
      options: {
        underscored: true,
        createdAt: false,
        updatedAt: false,
        primaryKey: false,
        indexes: [
          {
            name: 'broadcast_projection_version_index',
            fields: ['last_seen_event_uuid', 'projection_name']
          }
        ]
      }
    }
  }

  static schema (app, Sequelize) {
    return {
      projection_name: {
        type: Sequelize.STRING,
        primaryKey: true,
        binaryOptional: false,
        binaryType: 'string'
      },
      // last seen ID
      last_seen_event_uuid: {
        type: Sequelize.UUID,
        // primaryKey: true,
        binaryOptional: false,
        binaryType: 'string'
      },
      // last seen sequence number
      last_seen_event_number: {
        type: Sequelize.BIGINT,
        binaryOptional: false,
        defaultValue: 0,
        binaryType: 'int'
      },
      inserted_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        binaryOptional: false,
        binaryType: 'date'
      },
      updated_at: {
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
