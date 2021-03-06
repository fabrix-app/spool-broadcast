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
    sequelize: {
      plugins: {
        hierarchy: require('sequelize-hierarchy')
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
      logger: new smokesignals.Logger('silly')
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
          'Test',
          'TestBroadcast2'
        ],
      },

      /**
       * Tell the broadcaster to trace requests,
       * this is a RAM heavy operation and should be false in production
       */
      broadcasters: {
        Test: {
          trace: true
        },
        TestBroadcast2: {
          trace: false
        }
      },

      pipelines: {
        // Pipeline
        TestPipeline: {
          broadcasters: {
            // Broadcaster
            Test: {
              // Pipeline Name
              'CreateAndFindTest': {
                // Entry function
                'Test.create': {
                  // before: function (req, body, options) {
                  //   console.log('BRK pipeline before 1', body)
                  //   return [req, body, {parent: options}]
                  // },
                  after: function(req, body, options) {
                    console.log('BRK pipeline after 2', body)
                    return [req, body, options]
                  },
                  zip: {
                    event_type: 'event_type',
                    object: 'object',
                    data: 'data'
                  }
                },
                // Entry function
                'Test.findByPk': {
                  before: function (req, body, options) {
                    body = {
                      params: {
                        test_uuid: body.data.test_uuid
                      },
                      query: {}
                    }
                    console.log('BRK pipeline before 3', body)
                    return [req, body, {parent: options}]
                  },
                  after: function(req, body, options) {
                    console.log('BRK pipeline after 4', body)
                    return [req, body, options]
                  },
                  zip: {
                    data: 'data'
                  }
                }
              },
              // Pipeline Name
              'Skip': {
                // Entry function
                'Test.create': {
                  if: function(req, body, options) {
                    return false
                  }
                }
              }
            }
          }
        }
      },
      dispatchers: {
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
                somethingElse: {
                  consistency: 'strong',
                  config: {
                    priority: 3,
                    expects_input: 'Test'
                  }
                },
                multiSomethingElse: {
                  consistency: 'strong',
                  config: {
                    priority: 3,
                    expects_input: 'Test'
                  }
                },
              },
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
                created2: {
                  lifespan: 'ephemeral',
                  config: {
                    priority: 3,
                    expects_input: ['Test', 'Test.list']
                  }
                },
              },
            },
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
                    expects_input: ['Test', 'Test.list']
                  }
                },
                created2: {
                  lifespan: 'ephemeral',
                  config: {
                    priority: 3,
                    expects_input: ['Test', 'Test.list']
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
              },

              'test.destroyed': {
                logger: {
                  consistency: 'eventual',
                  config: {
                    priority: 2,
                    expects_input: 'Test',
                    merge: true,
                    expects_output: 'TestLogger'
                  }
                },
              },

              // TEST a wildcard eventual event
              'test.*': {
                wild: {
                  consistency: 'eventual',
                  config: {
                    priority: 255,
                    expects_input: '*',
                    expects_response: '*',
                    expects_output: '*',
                    options: {
                      save: false
                    }
                  }
                },
              },
            },
            TestBroadcast2: {
              /**
               * Events subscribed to
               */
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
              },
            }
          }
        },
        TestMulti: {
          broadcasters: {
            /**
             * Broadcaster that the Test Projectors are responding to
             */
            Test: {
              'eventual.tested': {
                one: {
                  consistency: 'eventual',
                  config: {
                    priority: 1,
                    expects_input: 'Test',
                    retry_limit: 1
                  }
                },
                two: {
                  consistency: 'eventual',
                  config: {
                    priority: 2,
                    expects_input: 'Test',
                    retry_limit: 2
                  }
                },
                three: {
                  consistency: 'eventual',
                  config: {
                    priority: 3,
                    expects_input: 'Test',
                    retry_limit: 3
                  }
                },
              },
            },
          }
        },
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
               * Events subscribed to
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
                createMany: {
                  consistency: 'strong',
                  config: {
                    priority: 2,
                    expects_input: 'Test',
                    dispatches_command: 'create.:test_uuid.test',
                    expects_response: 'Test',
                    merge: {
                      as: 'children'
                    },
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

              'test.created.list': {
                bulkUpdate: {
                  consistency: 'strong',
                  config: {
                    priority: 1,
                    expects_input: 'Test.list',
                    dispatches_command: 'update.test.list',
                    expects_response: 'Test.list',
                    merge: true,
                  }
                },
                bulkAside: {
                  consistency: 'strong',
                  config: {
                    priority: 1,
                    expects_input: 'Test.list',
                    dispatches_command: 'create.test.list',
                    expects_response: 'Test', // Expects each response
                    zip: {
                      on: 'test_uuid'
                    },
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
                    merge: true,
                    data: {
                      merge: true
                    },
                    // metadata: {
                    //   merge: true
                    // }
                  }
                },
              },

              'eventual.tested': {
                eventual: {
                  consistency: 'eventual',
                  config: {
                    priority: 4,
                    expects_input: 'Test',
                    retry_limit: 1,
                    expects_response: 'Test',
                    expects_output: 'Test',
                  }
                },
              }
            },

            // When Broadcast2 says something is updated, then destroy it through Broadcast 1
            TestBroadcast2: {
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
            }
          }
        },
        TestProcessor2: {
          broadcasters: {
            /**
             * Broadcasters that the TestProcessor2 Processors are responding to
             */
            TestBroadcast2: {
              /**
               * Events subscribed to
               */
              'test.created': {
                update: {
                  consistency: 'strong',
                  config: {
                    priority: 2,
                    expects_input: 'Test',
                    dispatches_command: 'update.test',
                    expects_response: 'Test',
                    merge: true,
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
