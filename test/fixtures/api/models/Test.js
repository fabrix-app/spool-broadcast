'use strict'
const BroadcastObjectModel = require('../../../../dist').BroadcastObjectModel
const BroadcastResolver = require('../../../../dist').BroadcastResolver

/**
 * Test
 *
 * @description A Test model
 */
module.exports = class Test extends BroadcastObjectModel {

  static get resolver() {
    return BroadcastResolver
  }

  static config(app, Sequelize) {
    return {
      //More information about supported models options here : http://docs.sequelizejs.com/en/latest/docs/models-definition/#configuration
      options: {

      }
    }
  }

  static schema(app, Sequelize) {
    return {
      test: {
        type: Sequelize.VIRTUAL(Sequelize.STRING),
        binaryOptional: true,
        binaryType: 'string'
      },
      test_uuid: {
        type: Sequelize.VIRTUAL(Sequelize.UUID),
        binaryOptional: true,
        binaryType: 'string'
      },
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
