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
        require('@fabrix/spool-errors').ErrorsSpool,
        require('@fabrix/spool-express').ExpressSpool,
        require('@fabrix/spool-realtime').RealtimeSpool,
        require('@fabrix/spool-sequelize').SequelizeSpool,
        require('../../dist').BroadcastSpool // spool-broadcast
      ],
      paths: {
        www: 'test/fixtures',
      }
    },
    web: {
      express: require('express'),
      middlewares: {
        order: [
          'static',
          'addMethods',
          'cookieParser',
          'session',
          'bodyParser',
          'methodOverride',
          'router',
          'www',
          '404',
          '500'
        ],
        static: require('express').static('test/fixtures')
      },
      port: process.env.PORT || 3000
    },
    realtime: {
      // The path to save the primus.js
      path: 'test/fixtures/primus',
      // The configuration for the primus instance
      primus: {
        // fortress: 'spark',
        // 'mirage timeout': 5000
        // redis: {
        //   host: 'localhost',
        //   port: 6379,
        //   channel: 'primus' // Optional, defaults to `'primus`'
        // },
        // transformer: 'websockets'
      },
      // Plugins for Primus.use
      plugins: {
        // 'fortress maximus': require('fortress-maximus'),
        // 'mirage': require('mirage')
        // redis: PrimusRedisRooms
      }
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
