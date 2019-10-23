'use strict'

const BroadcastModel = require('../../../../dist').BroadcastModel
const BroadcastResolver = require('../../../../dist').BroadcastResolver

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
        primaryKey: false
      }
    }
  }

  static schema(app, Sequelize) {
    return {
      name: {
        type: Sequelize.STRING,
        binaryOptional: true,
        binaryType: 'string'
      }
    }
  }

  //If you need associations, put them here
  static associate(models) {

  }
}