import { Type } from 'js-binary'
import { isArray, isObject } from 'lodash'

import { BroadcastModel } from '../../BroadcastModel'


/**
 * @module BroadcastSnapshot
 * @description
 */
export class BroadcastSnapshot extends BroadcastModel {

  static config(app, Sequelize) {
    return {
      options: {
        underscored: true,
        updatedAt: false,
        indexes: [
          {
            name: 'broadcast_snapshot_index',
            fields: ['source_uuid', 'source_object']
          }
        ],
        hooks: {}
      }
    }
  }

  static schema(app, Sequelize) {
    return {
      // ID
      source_uuid: {
        type: Sequelize.UUID,
        primaryKey: true,
        binaryOptional: false,
        binaryType: 'string'
      },
      source_version: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        binaryOptional: false,
        binaryType: 'int'
      },
      source_object: {
        type: Sequelize.STRING,
        binaryOptional: false,
        binaryType: 'string'
      },
      data: {
        type: Sequelize.JSONB,
        defaultValue: {},
        binaryOptional: false,
        binaryType: 'json'
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
        binaryOptional: false,
        binaryType: 'json'
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
