const _ = require('lodash')
const smokesignals = require('smokesignals')
const Api = require('./api/index')

const App = {
  pkg: {
    name: '@fabrix/broadcast-spool-test',
    version: '1.0.0'
  },
  api: Api,
  config: {
    stores: {
      sequelize: {
        migrate: 'drop',
        orm: 'sequelize',
        database: 'Sequelize',
        host: '127.0.0.1',
        dialect: 'postgres'
      }
    },
    models: {
      defaultStore: 'sequelize',
      migrate: 'drop'
    },
    main: {
      spools: [
        require('@fabrix/spool-router').RouterSpool,
        require('@fabrix/spool-sequelize').SequelizeSpool,
        require('../../dist').BroadcastSpool // spool-broadcast
      ]
    },
    log: {
      logger: new smokesignals.Logger('debug')
    },

    broadcasts: {
      auto_transaction: true,
      /**
       * Connection for eventually consistent events
       */
      connection: {
        /**
         * Connection information could also be passed via uri
         */
      },
      /**
       * Profile for this Fabrix instance
       */
      profile: process.env.BROADCAST_PROFILE || 'development',
      /**
       * Broadcasters to run for profile definition
       * <profile>: [
       *   <Broadcast>
       * ]
       */
      profiles: {
        development: [
          'Test'
        ],
      },

      pipelines: {
        Test: {
          broadcasters: {}
        }
      },
      hooks: {
        Test: {
          broadcasters: {
            /**
             * Broadcaster that the Channel Carts are hooked into
             */
            Test: {
              /**
               * Commands subscribed to
               */
              'test.create': {
                create: {
                  lifecycle: 'before',
                  config: {
                    priority: 1,
                    receives: 'Test',
                    merge: true,
                    expects: 'Test'
                  }
                },
              }
            }
          }
        }
      },
      projectors: {
        Test: {
          broadcasters: {}
        }
      },
      processors: {
        Test: {
          broadcasters: {}
        }
      },
    }
  }
}

// _.defaultsDeep(App, smokesignals.FailsafeConfig)
module.exports = App
