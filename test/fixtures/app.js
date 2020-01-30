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
        // 'multiplex': require('primus-multiplex'),
        // 'emitter': require('primus-emitter'),
        // 'resource': require('primus-resource')
        'rooms': require('primus-rooms')
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
            Test: {
              'CreateAndFindTest': {
                'Test.create': {
                  zip: {
                    event_type: 'event_type',
                    object: 'object',
                    data: 'data'
                  }
                },
                'Test.findByPk': {
                  before: function (req, body, options) {
                    body = {
                      params: {
                        test_uuid: body.data.test_uuid
                      },
                      query: {}
                    }
                    return [req, body, {parent: options}]
                  },
                  // after: function(req, body, options) {
                  //   console.log('BRK trial after 2', body.data)
                  //   return [req, body, options]
                  // },
                  zip: {
                    data: 'data'
                  }
                }
              }
            }
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
                    expects_input: 'Test'
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
                    expects_input: 'Test'
                  }
                },
              },
            }
          }
        },

        Test2: {
          broadcasters: {
            /**
             * Broadcaster that the Test BroadcastChannel is listening to
             */
            Test: {
              /**
               * Events subscribed to
               */
              'test.:test_uuid.created': {
                created2: {
                  lifespan: 'eternal',
                  config: {
                    priority: 1,
                    expects_input: 'Test'
                  }
                },
              },
              /**
               * Events subscribed to
               */
              'test.:test_uuid.:crud': {
                crud2: {
                  lifespan: 'eternal',
                  config: {
                    priority: 2,
                    expects_input: 'Test'
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
                    expects_input: 'Test',
                    merge: true,
                    expects_response: 'Test'
                  }
                },
              },
              'create.:test_uuid.test': {
                create: {
                  lifecycle: 'before',
                  config: {
                    priority: 1,
                    expects_input: 'Test',
                    merge: true,
                    expects_response: 'Test'
                  }
                },
              },
              'update.test': {
                update: {
                  lifecycle: 'before',
                  config: {
                    priority: 1,
                    expects_input: 'Test',
                    merge: true,
                    expects_response: 'Test'
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
                    expects_input: 'Test',
                    merge: true,
                    expects_output: 'Test'
                  }
                },
                logger: {
                  consistency: 'eventual',
                  config: {
                    priority: 3,
                    expects_input: 'Test',
                    merge: true,
                    expects_output: 'TestLogger'
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
                    expects_input: 'Test',
                    merge: true,
                    expects_output: 'Test'
                  }
                },
                logger: {
                  consistency: 'eventual',
                  config: {
                    priority: 3,
                    expects_input: 'Test',
                    merge: true,
                    expects_output: 'TestLogger'
                  }
                },
              },

              'test.:test_uuid.test.:test_uuid.created': {
                created: {
                  consistency: 'strong',
                  config: {
                    priority: 1,
                    expects_input: 'Test',
                    merge: true,
                    expects_output: 'Test'
                  }
                },
                logger: {
                  consistency: 'eventual',
                  config: {
                    priority: 3,
                    expects_input: 'Test',
                    merge: true,
                    expects_output: 'TestLogger'
                  }
                },
              },

              'test.created': {
                created: {
                  consistency: 'strong',
                  config: {
                    priority: 1,
                    expects_input: 'Test',
                    merge: true,
                    expects_output: 'Test'
                  }
                },
                created2: {
                  consistency: 'strong',
                  config: {
                    priority: 2,
                    expects_input: 'Test',
                    merge: true,
                    expects_output: 'Test'
                  }
                },
                logger: {
                  consistency: 'eventual',
                  config: {
                    priority: 3,
                    expects_input: 'Test',
                    merge: true,
                    expects_output: 'TestLogger'
                  }
                },
              },

              'test.updated': {
                updated: {
                  consistency: 'strong',
                  config: {
                    priority: 1,
                    expects_input: 'Test',
                    merge: true,
                    expects_output: 'Test'
                  }
                },
                logger: {
                  consistency: 'eventual',
                  config: {
                    priority: 2,
                    expects_input: 'Test',
                    merge: true,
                    expects_output: 'TestLogger'
                  }
                },
                failLogger: {
                  consistency: 'eventual',
                  config: {
                    priority: 3,
                    expects_input: 'Test',
                    merge: true,
                    expects_output: 'TestLogger'
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
                    expects_input: 'Test',
                    dispatches_command: 'update.test.:test_uuid',
                    expects_response: 'Test',
                    merge: true,
                  }
                },
              },

              'test.created': {
                update: {
                  consistency: 'strong',
                  config: {
                    priority: 1,
                    expects_input: 'Test',
                    dispatches_command: 'update.test.:test_uuid',
                    expects_response: 'Test',
                    merge: true,
                  }
                },
              },

              'test.updated': {
                destroy: {
                  consistency: 'strong',
                  config: {
                    priority: 1,
                    expects_input: 'Test',
                    dispatches_command: 'destroy.test.:test_uuid',
                    expects_response: 'Test',
                    merge: true
                  }
                },
              },

              'test.:test_uuid.updated': {
                destroy: {
                  consistency: 'strong',
                  config: {
                    priority: 1,
                    expects_input: 'Test',
                    dispatches_command: 'destroy.test.:test_uuid',
                    expects_response: 'Test',
                    merge: true
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
