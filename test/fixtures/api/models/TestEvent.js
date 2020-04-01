'use strict'

const BroadcastObjectModel = require('../../../../dist').BroadcastObjectModel
const BroadcastResolver = require('../../../../dist').BroadcastResolver

/**
 * Test
 *
 * @description A Test model
 */
module.exports = class TestEvent extends BroadcastObjectModel {

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
    return {
      event_type: {
        type: Sequelize.STRING,
        binaryOptional: true,
        binaryType: 'string'
      },
      consistency: {
        type: Sequelize.STRING,
        binaryOptional: true,
        binaryType: 'string'
      },
      count: {
        type: Sequelize.INTEGER,
        binaryOptional: true,
        binaryType: 'int'
      }
    }
  }

  //If you need associations, put them here
  static associate(models) {

  }
}
