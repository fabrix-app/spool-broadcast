'use strict'

const BroadcastObjectModel = require('../../../../dist').BroadcastObjectModel
const BroadcastResolver = require('../../../../dist').BroadcastResolver

/**
 * Test
 *
 * @description A Test model
 */
class TestPrivate extends BroadcastObjectModel {

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
      test: {
        type: Sequelize.STRING,
        binaryOptional: true,
        binaryType: 'string'
      },
      before: {
        type: Sequelize.STRING,
        binaryOptional: true,
        binaryType: 'string'
      },
      after: {
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

TestPrivate.prototype.toJSON = function() {
  const resp = this.get({plain: true})

  console.log('BRK private 1', resp)

  delete resp.before
  delete resp.after

  console.log('BRK private 2', resp)

  return resp
}

module.exports = TestPrivate
