'use strict'
const BroadcastObjectModel = require('../../../../dist').BroadcastObjectModel
const BroadcastResolver = require('../../../../dist').BroadcastResolver
const uuid = require('uuid/v4')
/**
 * Test
 *
 * @description A Test model
 */
class Test extends BroadcastObjectModel {

  static get resolver() {
    return BroadcastResolver
  }

  static config(app, Sequelize) {
    return {
      //More information about supported models options here : http://docs.sequelizejs.com/en/latest/docs/models-definition/#configuration
      options: {
        timestamps: false
      }
    }
  }

  static schema(app, Sequelize) {
    return {
      test_uuid: {
        type: Sequelize.UUID,
        notNull: true,
        primaryKey: true,
        binaryOptional: false,
        binaryType: 'string'
      },

      test: {
        type: Sequelize.VIRTUAL(Sequelize.STRING),
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

Test.prototype.generateUUID = function (config = {}, options = {}) {
  Object.keys(config.get && typeof config.get === 'function' ? config.get({ plain: true }) : config)
    .forEach(k => {
      this[k] = config[k]
    })

  if (this.isNewRecord) {
    if (!this.test_uuid) {
      this.test_uuid = uuid()
    }
  }
  return this
}

module.exports = Test

