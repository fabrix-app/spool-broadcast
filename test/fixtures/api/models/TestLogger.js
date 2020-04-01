'use strict'
const Utils =  require('@fabrix/spool-sequelize').Utils
const BroadcastModel = require('../../../../dist').BroadcastModel
const BroadcastResolver = require('../../../../dist').BroadcastResolver
const BroadcastEvent = require('../../../../dist').BroadcastEvent

/**
 * Test
 *
 * @description A Test model
 */
module.exports = class TestLogger extends BroadcastModel {

  static get resolver() {
    return BroadcastResolver
  }

  static config(app, Sequelize) {
    return {
      //More information about supported models options here : http://docs.sequelizejs.com/en/latest/docs/models-definition/#configuration
      options: {
        primaryKey: false,
        timestamps: false
      }
    }
  }

  static schema(app, Sequelize) {
    return Utils.mergeConfig(BroadcastEvent.schema(app, Sequelize), {
      event_uuid: {
        type: Sequelize.UUID,
        primaryKey: false,
        binaryOptional: true,
        binaryType: 'string'
      },
      name: {
        type: Sequelize.STRING,
        binaryOptional: true,
        binaryType: 'string'
      }
    })
  }

  //If you need associations, put them here
  static associate(models) {

  }
}
