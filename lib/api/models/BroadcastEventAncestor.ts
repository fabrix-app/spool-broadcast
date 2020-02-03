import { FabrixModel as Model} from '@fabrix/fabrix/dist/common'
import uuid from 'uuid/v4'
import { Type } from '../../binary'
import { BroadcastModelResolver } from '../../BroadcastModel'

import joi from 'joi'


export class BroadcastEventAncestorResolver extends BroadcastModelResolver {
}

/**
 * @module BroadcastEventAncestor
 * @description Channel Event Ancestors
 */
export class BroadcastEventAncestor extends Model {

  static get resolver() {
    return BroadcastEventAncestorResolver
  }

  static config(app, Sequelize) {
    return {
      options: {
        underscored: true,
        primaryKey: false,
        timestamps: false,
        indexes: [
          // {
          //   unique: true,
          //   fields: ['channel_uuid', 'event_uuid', 'item_uuid', 'item_object']
          // }
        ]
      }
    }
  }

  static schema(app, Sequelize) {
    return {
      // The event
      event_uuid: {
        type: Sequelize.UUID,
        references: {
          // This is a reference to another model
          model: app.models.BroadcastEvent.instance,
          // This is the column name of the referenced model
          key: 'event_uuid',
          // This declares when to check the foreign key constraint.
          deferrable: Sequelize.Deferrable.INITIALLY_DEFERRED
        },
        notNull: true,
        primaryKey: true, // Composite
        binaryOptional: false,
        binaryType: 'string',
        joi: joi.string().guid().required()
      },
      ancestor_uuid: {
        type: Sequelize.UUID,
        references: {
          // This is a reference to another model
          model: app.models.BroadcastEvent.instance,
          // This is the column name of the referenced model
          key: 'event_uuid',
          // This declares when to check the foreign key constraint.
          deferrable: Sequelize.Deferrable.INITIALLY_DEFERRED
        },
        notNull: true,
        primaryKey: true, // Composite
        binaryOptional: false,
        binaryType: 'string',
        joi: joi.string().guid().required()
      }
    }
  }

  // /**
  //  * Associate the Model
  //  * @param models
  //  */
  // public static associate (models) {
  //
  // }
}

