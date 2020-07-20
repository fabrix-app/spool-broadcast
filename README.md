# spool-broadcast

[![Gitter][gitter-image]][gitter-url]
[![NPM version][npm-image]][npm-url]
[![Build Status][ci-image]][ci-url]
[![Test Coverage][coverage-image]][coverage-url]
[![Dependency Status][daviddm-image]][daviddm-url]
[![Follow @FabrixApp on Twitter][twitter-image]][twitter-url]

[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

:package: Broadcast Spool

A Spool that implements CQRS/Event Sourcing patterns, with extraordinary route pattern matching.

Spool-broadcast helps distribute your [Fabrix Applications](https://github.com/fabrix-app/fabrix) with a specialized broadcasting pattern over a PubSub and WebSockets.

## Why?
Event sourcing your functional workflow makes building complicated or distributed apps easier.  With Spool-broadcast, you can dispatch events over different broadcasters and domain lines and have the operations wrapped in a single ACID transaction that is easy to manage. This makes adding new operations to a sequence trivial and application development easier to distribute. It also measures the completion time for each operation so that you can find logical bottle necks while also validating the data transformations at every step.

Additionally, Spool-broadcast also has a very powerful retry engine, so that it can try and keep operations alive while it's waiting on third parties to complete without having to dump the entire command/event.

Spool-broadcast runs Commands, SAGAs, Events, Processors, and Socket Channels!

## Install
You will need NPM or Yarn installed to install spool-broadcast (and fabrix)

```sh
$ npm install --save @fabrix/spool-broadcast
```

Broadcast has a few dependency Spools:

Joi, Errors, Sequelize, Realtime, Retry

```sh
$ npm install --save @fabrix/spool-realtime @fabrix/spool-joi @fabrix/spool-errors @fabrix/spool-sequelize, @fabrix/spool-realtime, @fabrix/spool-retry
```

Additionally, If you install the plugin `sequelize-hierarchy`, then it will turn the BroadcastEvent into a CTE, which is useful for debugging and creates a help table, `broadcasteventancetors`.

## Configure

```js
// config/main.ts
import { BroadcastSpool } from '@fabrix/spool-broadcast'
import { RealtimeSpool } from '@fabrix/spool-realtime'
import { SequelizeSpool } from '@fabrix/spool-sequelize'
import { ErrorsSpool } from '@fabrix/spool-errors'
import { JoiSpool } from '@fabrix/spool-joi'

export const main = {
  spools: [
    // ... other spools
    ErrorsSpool,
    JoiSpool,
    RealtimeSpool,
    SequelizeSpool,
    BroadcastSpool
    // ... other spools
  ]
}
```
## Definitions
### SAGA
A running pattern that acts as a smart circuit breaker.  For example, when there is an error in the event loop, operations that we're called in the SAGA will be given a cancel command to "Reverse" what they did.  In real life, this is something like where your operation books a flight, a hotel, and a car, if the car if the flight is not available, you would want to cancel the booking of the hotel and car.   

### Pipelines
An Event Emitter that runs Actions and Commands in a Sequence.  They are for "Transaction Blocks", for example: when you want certain operations to happen in a sequence that have clear and determined seperations in transactions.

### Hooks
Command listeners that will run before or after the SAGA.  Once a command is requested, you may wish to do some validation on the command, imbue it with more data, or run some various logic or calculations. Hooks can be used before and after the SAGA, however, they are not reversed like operations in the SAGA are.

### Processors
Event listeners that will trigger more events.  When an event is dispatched, there may be commands that you want to correlate with the command.  When a processor is called, it will return it's value before the next tick in the Broadcast Event loop. This is what allows for spool-broadcast to make exteremly in-depth trees of commands/events predictably.

### Projectors
Event listener that will save data from an event into a projection. A projection are just an easy Read table(s) that make reading from aggregates faster and easier to understand.

### Dispatchers
A dispatcher creates a secondary event from a primary event without running through the normal processes.

### Aggregates
TODO

### Channel
A list of socket subscribers that get notified when an event occurs. For example, you want people to know in a different application that something has happened on your application.

![Broadcast Event Loop](https://github.com/fabrix-app/spool-broadcast/blob/master/images/spool-broadcast-event-loop.png)

### Concepts
Spool-broadcast uses a transaction to make an "all or nothing" ACID transaction for the resulting Aggregate update.  You should use the SAGA pattern in the command pipe to make non-acid transactions mid flight, or use Pipelines to create transaction blocks.  This allows for complex trees of commands and events to be performed in a reliable and predictable way.

A full event flow example:

- Create User (command)
  - Is User Unique (pre-hook)
  - Tell 3rd party that user is joining (saga)
     - Anything that fails after this point, Tell the 3rd party to redact that operation (saga reverse)
  - Add 3rd party response to User data (post-hook)
- User is Created (event)
  - Add User's Profile in a database (projectors)
  - Add User to New Friends List (processor)
    - Create Friend List Entry (command)
  - Update User's friends list in the database (projectors)
  - Broadcast to a Channel that User is created (channel)


## Configuration
```js
export const broadcast = {
  /**
   * If broadcast should handle transactions, highly recommended true
   */
  auto_transaction: true,
  /**
   * Connection for eventually consistent events
   */
  connection: {
    /**
     * Connection information could also be passed via uri
     */
    uri: process.env.CLOUDAMQP_URL
  },

  /**
   * Profile for this Fabrix instance, this will only allow Broadcast in this profile to run.
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
      'CartBroadcast',
      'CollectionBroadcast',
      'UserBroadcast'
    ],
  },
  /**
   * Add Special Configurations to the broadcaster such as tracing
   */
  broadcasters: {
    CartBroadcast: { trace: true }
  },
  /**
   * Pipeline subscriptions to Broadcasters
   * e.g.
   * <Pipeline>: {
   *   broadcasters: {
   *     <Broadcast>: {
   *       pipeline: {
   *         <Entry.point>: {
   *           config: {}
   *         }
   *       }
   *     }
   *   }
   * }
   */
  pipelines: {
    /**
    * The Name of the Pipeline Resource 
    */
    CollectionPipeline: {
      broadcasters: {
        /**
        * The name of the Broadcast to listend to 
        */
        CollectionBroadcast: {
          'Unique_Name': {
            'Collection.createCollection': {
              zip: {
                event_type: 'event_type',
                object: 'object',
                data: 'data'
              }
            },
            'Collection.findByPkCollection': {
              before: function (req, body, options) {
                body = {
                  params: {
                    channel_uuid: body.data.channel_uuid,
                    cart_uuid: body.data.cart_uuid
                  },
                  query: {}
                }
                return [req, body, { parent: options }]
              },
              // after: function(req, body, options) {
              //   console.log('BRK trial after 2', body.data)
              //   return [req, body, options]
              // },
              zip: {
                data: 'data'
              }
            }
          },
        }
      }
    },
  },


  channels: {
    TestChannel: {
      broadcasters: {
        /**
         * Broadcaster that the Test BroadcastChannel is listening to
         */
        TestBroadcaster: {
          /**
           * Events subscribed to
           */
          'test.created': {
           /**
            * Channel methods to run when event committed
            */
            created: {
              lifespan: 'eternal',
              config: {
                priority: 1,
                expects_input: 'TestModel'
              }
            },
          },
          'test.:crud': {
           /**
            * Channel methods to run when event committed
            */
            crud: {
              lifespan: 'eternal',
              config: {
                priority: 2,
                expects_input: 'TestModel'
              }
            },
            created2: {
              lifespan: 'ephemeral',
              config: {
                priority: 3,
                expects_input: ['TestModel', 'TestModel.list']
              }
            },
          },
        },
      }
    },
  },
  hooks: {
    /**
     * HookIns
     */
    TestHook: {
      broadcasters: {
        /**
         * Broadcaster that the Test BroadcastHookIn is hooked into
         */
        TestBroadcaster: {
          /**
           * Commands subscribed to
           */
          'create.test': {
           /**
            * Hook methods to run when command pattern is matched and dispatched
            */
            create: {
              lifecycle: 'before',
              config: {
                priority: 1,
                expects_input: 'TestModel',
                merge: true,
                expects_response: 'TestModel'
              }
            },
          },
          'create.:test_uuid.test': {
           /**
            * Hook methods to run when command pattern is matched and dispatched
            */
            create: {
              lifecycle: 'before',
              config: {
                priority: 1,
                expects_input: 'TestModel',
                merge: true,
                expects_response: 'TestModel'
              }
            },
            satisfy: {
              lifecycle: 'after',
              config: {
                priority: 1,
                expects_input: 'TestModel',
                merge: true,
                expects_response: 'TestModel'
              }
            },
          },
          '*.test': {
           /**
            * Hook methods to run when command pattern is matched and dispatched
            */
            shouldBeProper: {
              lifecycle: 'before',
              config: {
                priority: 1,
                expects_input: 'TestModel',
                merge: true,
                expects_response: 'TestModel'
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
    TestProcessor: {
      /**
       * ... some processor configuration if required
       */
      broadcasters: {
        /**
         * Broadcasters that the Test Processors are responding to
         */
        TestBroadcaster: {
          /**
           * Events subscribed to
           */
          'test.:test_uuid.created': {
            /**
             * Processor methods to run when event pattern is matched and dispatched
             */
            update: {
              consistency: 'strong',
              config: {
                priority: 1,
                expects_input: 'TestModel',
                dispatches_command: 'update.test.:test_uuid',
                expects_response: 'TestModel',
                expects_output: 'TestModel',
                data: {
                  merge: true,
                }
              }
            },
          },

          'test.created': {
            /**
             * Processor methods to run when event pattern is matched and dispatched
             */
            update: {
              consistency: 'strong',
              config: {
                priority: 1,
                expects_input: 'TestModel',
                dispatches_command: 'update.test.:test_uuid',
                expects_response: 'TestModel',
                expects_output: 'TestModel',
                data: {
                  merge: true,
                }
              }
            },
          },
        },
      }
    }
  },
  projectors: {
    /**
     * Projectors
     */
    TestProjector: {
      broadcasters: {
        /**
         * Broadcaster that the Test Projectors are responding to
         */
        TestBroadcaster: {
          'test.:crud': {
            /**
             * Projector methods to run when event pattern is matched and dispatched
             */
            myMethod: {
              consistency: 'strong',
              config: {
                priority: 3,
                expects_input: 'TestModel',
                data: {
                  merge: true,
                },
                expects_output: 'TestModel'
              }
            },
            myLoggerMethod: {
              consistency: 'eventual',
              config: {
                priority: 3,
                expects_input: 'TestModel',
                data: {
                  merge: true,
                },
                expects_output: 'TestLoggerModel'
              }
            },
          },
          'test.:test_uuid.created': {
            /**
             * Projector methods to run when event pattern is matched and dispatched
             */
            created: {
              consistency: 'strong',
              config: {
                priority: 1,
                expects_input: 'TestModel',
                data: {
                  merge: true,
                },
                expects_output: 'TestModel'
              }
            },
            logger: {
              consistency: 'eventual',
              config: {
                priority: 3,
                expects_input: 'TestModel',
                expects_output: 'TestLoggerModel'
              }
            },
          },

          'test.:test_uuid.test.:test_uuid.created': {
            /**
             * Projector methods to run when event pattern is matched and dispatched
             */
            created: {
              consistency: 'strong',
              config: {
                priority: 1,
                expects_input: 'TestModel',
                data: {
                  merge: true,
                },
                expects_output: 'TestModel'
              }
            },
            logger: {
              consistency: 'eventual',
              config: {
                priority: 3,
                expects_input: 'TestModel',
                expects_output: 'TestLoggerModel'
              }
            },
          },

          'test.*': {
           /**
            * Projector methods to run when event pattern is matched and dispatched
            */
            wild: {
              consistency: 'eventual',
              config: {
                priority: 255,
                expects_input: '*',
                expects_response: '*',
                expects_output: '*'
              }
            },
          },
        },
      }
    }
  }
}
```


## Usage
### BroadcastChannel
Channels are useful for letting other applications listen to your application over sockets. This is a useful pattern in micro services, but also doing things like realtime applications.

### BroadcastPipeline
Pipelines are useful for separating out your logic into transactional blocks.  Complicated command/event cycles in a single transaction can quickly add load to your database, so having clear lines to separate the transactions is paramount for weighty commands.  Pipelines are also useful for gathering a projected view after running a series of command/events.

### BroadcastHook
Hooks are useful when you want to run operations on a command before, during, and after the SAGA before a command is dispatched as event.

### BroadcastProcessor
Processors are useful when you want to dispatch a subsequent command when an event happens. Each processor makes a child transaction for the command/event sequence it dispatches so that it can also rollback if something later in the sequence fails.

### BroadcastProjector
Projectors are useful for saving event data in a useable way.  For example, a "User Created" event was dispatched, so now it might be nice to save their PII encrypted in one table, and their other details in a different table.  You can easily do this with multiple projectors on the same event.

### BroadcastDispatcher
Occasionally, you may need to multi-project when a projection is run and trigger side-events. Dispatchers let you trigger these without running a processor for a new event.  For example, an event happens and updates an aggregate or projection, but you have other listeners that don't need a fully new event to respond. This is different from a processor which will dispatch a new command, instead, a dispatcher is a "side effect" of an event that contains at least some data from the original event but has a different event id.

## Contributing
We love contributions! Please check out our [Contributor's Guide](https://github.com/fabrix-app/fabrix/blob/master/CONTRIBUTING.md) for more information on how our projects are organized and how to get started.

### Release Instructions
When the master is tagged with a release, it will automatically publish to npm, updates the Changelog and bumps the version. Fabrix uses the [standard-version library](https://www.npmjs.com/package/standard-version) to manage it all.

To run a patch release: 
```bash
npm run release -- --release-as patch
``` 
and then commit to master. `git push --follow-tags origin master`

You can also test the release by running
```bash
npm run release -- --dry-run --release-as patch
``` 

## License
Usage is currently under the [MIT License](https://github.com/fabrix-app/spool-broadcast/blob/master/LICENSE.md)

TLDR; In plain language, do what ever you want with library as long as you keep the license in your code, give credit to the authors, and you accept all the responsibility!

If you are making money using this library, consider sharing some of that sweet cheddar with the authors, they work really hard and would seriously appreciate it :smile:

[npm-image]: https://img.shields.io/npm/v/@fabrix/spool-broadcast.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@fabrix/spool-broadcast
[ci-image]: https://img.shields.io/circleci/project/github/fabrix-app/spool-broadcast/master.svg
[ci-url]: https://circleci.com/gh/fabrix-app/spool-broadcast/tree/master
[daviddm-image]: http://img.shields.io/david/fabrix-app/spool-broadcast.svg?style=flat-square
[daviddm-url]: https://david-dm.org/fabrix-app/spool-broadcast
[gitter-image]: http://img.shields.io/badge/+%20GITTER-JOIN%20CHAT%20%E2%86%92-1DCE73.svg?style=flat-square
[gitter-url]: https://gitter.im/fabrix-app/fabrix
[twitter-image]: https://img.shields.io/twitter/follow/FabrixApp.svg?style=social
[twitter-url]: https://twitter.com/FabrixApp
[coverage-image]: https://img.shields.io/codeclimate/coverage/github/fabrix-app/spool-broadcast.svg?style=flat-square
[coverage-url]: https://codeclimate.com/github/fabrix-app/spool-broadcast/coverage

