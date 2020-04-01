'use strict'

const BroadcastObjectModel = require('../../../../dist').BroadcastObjectModel
const BroadcastResolver = require('../../../../dist').BroadcastResolver

const uuid = require('uuid/v4')

/**
 * Test
 *
 * @description A Test model
 */
class TestChange extends BroadcastObjectModel {

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
      test_uuid: {
        type: Sequelize.UUID,
        notNull: true,
        primaryKey: true,
        binaryOptional: false,
        binaryType: 'string'
      },

      string: {
        type: Sequelize.STRING,
        binaryOptional: true,
        binaryType: 'string'
      },

      number: {
        type: Sequelize.INTEGER,
        binaryOptional: true,
        binaryType: 'int'
      },

      keyvalue: {
        type: Sequelize.JSONB,
        binaryOptional: true,
        binaryType: 'json'
      },

      array: {
        type: Sequelize.JSONB,
        binaryOptional: true,
        binaryType: 'json'
      }
    }
  }

  //If you need associations, put them here
  static associate(models) {

  }
}


TestChange.prototype.generateUUID = function (config = {}, options = {}) {
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

module.exports = TestChange
