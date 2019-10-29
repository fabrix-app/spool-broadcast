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
        'multiplex': require('primus-multiplex'),
        'emitter': require('primus-emitter'),
        'resource': require('primus-resource')
      }
    },
    log: {
      logger: new smokesignals.Logger('debug')
    },

    broadcast: {
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
          broadcasters: {
            Test: {}
          }
        }
      },

      channels: {
        /**
         * BroadcastChannels
         */
        Test: {
          broadcasters: {
            /**
             * Broadcaster that the Test BroadcastChannel is listening to
             */
            Test: {
              /**
               * Events subscribed to
               */
              'test.created': {
                created: {
                  lifespan: 'eternal',
                  config: {
                    priority: 1,
                    receives: 'Test'
                  }
                },
              },
              /**
               * Events subscribed to
               */
              'test.:crud': {
                crud: {
                  lifespan: 'eternal',
                  config: {
                    priority: 2,
                    receives: 'Test'
                  }
                },
              },
            }
          }
        }
      },
      hooks: {
        /**
         * HookIns
         */
        Test: {
          broadcasters: {
            /**
             * Broadcaster that the Test BroadcastHookIn is hooked into
             */
            Test: {
              /**
               * Commands subscribed to
               */
              'create.test': {
                create: {
                  lifecycle: 'before',
                  config: {
                    priority: 1,
                    receives: 'Test',
                    merge: true,
                    expects: 'Test'
                  }
                },
              },
              'create.:test_uuid.test': {
                create: {
                  lifecycle: 'before',
                  config: {
                    priority: 1,
                    receives: 'Test',
                    merge: true,
                    expects: 'Test'
                  }
                },
              },
              'update.test': {
                update: {
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
        /**
         * Projectors
         */
        Test: {
          broadcasters: {
            /**
             * Broadcaster that the Test Projectors are responding to
             */
            Test: {
              'test.:crud': {
                puff: {
                  consistency: 'strong',
                  config: {
                    priority: 3,
                    receives: 'Test',
                    merge: true,
                    expects: 'Test'
                  }
                },
                logger: {
                  consistency: 'eventual',
                  config: {
                    priority: 3,
                    receives: 'Test',
                    merge: true,
                    expects: 'TestLogger'
                  }
                },
              },
              /**
               * Commands subscribed to
               */
              'test.:test_uuid.created': {
                created: {
                  consistency: 'strong',
                  config: {
                    priority: 1,
                    receives: 'Test',
                    merge: true,
                    expects: 'Test'
                  }
                },
                logger: {
                  consistency: 'eventual',
                  config: {
                    priority: 3,
                    receives: 'Test',
                    merge: true,
                    expects: 'TestLogger'
                  }
                },
              },

              'test.created': {
                created: {
                  consistency: 'strong',
                  config: {
                    priority: 1,
                    receives: 'Test',
                    merge: true,
                    expects: 'Test'
                  }
                },
                created2: {
                  consistency: 'strong',
                  config: {
                    priority: 2,
                    receives: 'Test',
                    merge: true,
                    expects: 'Test'
                  }
                },
                logger: {
                  consistency: 'eventual',
                  config: {
                    priority: 3,
                    receives: 'Test',
                    merge: true,
                    expects: 'TestLogger'
                  }
                },
              },

              'test.updated': {
                updated: {
                  consistency: 'strong',
                  config: {
                    priority: 1,
                    receives: 'Test',
                    merge: true,
                    expects: 'Test'
                  }
                },
                logger: {
                  consistency: 'eventual',
                  config: {
                    priority: 2,
                    receives: 'Test',
                    merge: true,
                    expects: 'TestLogger'
                  }
                },
                failLogger: {
                  consistency: 'eventual',
                  config: {
                    priority: 3,
                    receives: 'Test',
                    merge: true,
                    expects: 'TestLogger'
                  }
                },
              }
            }
          }
        }
      },
      processors: {
        /**
         * Processors
         */
        Test: {
          broadcasters: {
            /**
             * Broadcasters that the Test Processors are responding to
             */
            Test: {
              /**
               * Commands subscribed to
               */
              'test.:test_uuid.created': {
                update: {
                  consistency: 'strong',
                  config: {
                    priority: 1,
                    receives: 'Test',
                    merge: true,
                    expects: 'Test'
                  }
                },
              },

              'test.created': {
                update: {
                  consistency: 'strong',
                  config: {
                    priority: 1,
                    receives: 'Test',
                    merge: true,
                    expects: 'Test'
                  }
                },
              },

              'test.updated': {
                destroy: {
                  consistency: 'strong',
                  config: {
                    priority: 1,
                    receives: 'Test',
                    merge: true,
                    expects: 'Test'
                  }
                },
              },

              'test.:test_uuid.updated': {
                destroy: {
                  consistency: 'strong',
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
    }
  }
}

// _.defaultsDeep(App, smokesignals.FailsafeConfig)
module.exports = App
