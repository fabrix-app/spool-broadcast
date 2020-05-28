import { FabrixModel as Model} from '@fabrix/fabrix/dist/common'
import uuid from 'uuid/v4'
import { BroadcastResolver } from './BroadcastResolver'

export class BroadcastModelResolver extends BroadcastResolver {
  generateUUID(options: {[key: string]: any} = {}) {
    return uuid()
  }
}

/**
 * @module BroadcastModel
 * @description
 */
export class BroadcastModel extends Model {

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
            fields: ['event_uuid']
          }
        ],
        hooks: {
          // beforeValidate: [
          //   (model, options) => {
          //     model.compress()
          //   }
          // ],
          // beforeSave: [
          //   (model, options) => {
          //     model.compress()
          //   }
          // ],
          // afterSave: [
          //   (model, options) => {
          //     model.extract()
          //   }
          // ]
        }
      }
    }
  }

  // static schema (app, Sequelize) {
  //   return {
  //     // ID
  //     event_uuid: {
  //       type: Sequelize.UUID,
  //       primaryKey: true
  //     },
  //     // Causation Id of the model is the Model Id of the model we are responding to
  //     causation_uuid: {
  //       type: Sequelize.UUID
  //     },
  //     // Correlation Id of the model we are responding to in our model
  //     correlation_uuid: {
  //       type: Sequelize.UUID
  //     },
  //     // The model string
  //     event_type: {
  //       type: Sequelize.STRING
  //     },
  //     object: {
  //       type: Sequelize.STRING
  //     },
  //     // Binary of Model
  //     data: {
  //       type: Sequelize.BLOB
  //     },
  //     // Binary of Metadata
  //     metadata: {
  //       type: Sequelize.BLOB
  //     },
  //     version: {
  //       type: Sequelize.INTEGER,
  //       defaultValue: 1
  //     },
  //     // Live Mode
  //     live_mode: {
  //       type: Sequelize.BOOLEAN,
  //       defaultValue: app.config.get('platform.live_mode')
  //     },
  //     created_at: {
  //       type: Sequelize.DATE,
  //       defaultValue: Sequelize.NOW
  //     }
  //   }
  // }

  /**
   * Associate the Model
   * @param models
   */
  // public static associate (models) {
  //
  // }
}

export interface BroadcastModel {
  toJSON(): {[key: string]: any}
  generateUUID(config?, options?): any
}

BroadcastModel.prototype.toJSON = function() {
  // const resp = this instanceof this.app.models.BroadcastEvent.instance ? this.get({ plain: true }) : this

  const resp = this.get({ plain: true })

  resp.object = this.getDataValue('object')

  if (typeof resp.object === 'object') {
    this.app.log.silly('BRK todo toJSON fix 1')
    resp.object = this.object.constructor.name
  }

  // Object.keys(resp).forEach(k => {
  //   console.log(this.name, 'brk resp', k, resp[k])
  // })

  if (!this._data && Buffer.isBuffer(this.getDataValue('data'))) {
    this.app.log.silly('BRK todo toJSON fix 2')
    resp.data = this.app.models[resp.object.replace(/\.[^.].*/, '')]
      .fromBinaryData(this.getDataValue('data'), resp.object)
  }

  if (!this._metadata && Buffer.isBuffer(this.getDataValue('metadata'))) {
    this.app.log.silly('BRK todo toJSON fix 3')
    resp.metadata = this.app.models[resp.object.replace(/\.[^.].*/, '')]
      .fromBinaryMetadata(this.getDataValue('metadata'), resp.object)
  }

  return resp
}

BroadcastModel.prototype.generateUUID = function (config = {}, options = {}) {

  // if (this.isNewRecord) {
    if (!this.event_uuid) {
      this.event_uuid = uuid()
    }
  // }

  return this
}
