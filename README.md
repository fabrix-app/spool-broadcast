# spool-broadcast

[![Gitter][gitter-image]][gitter-url]
[![NPM version][npm-image]][npm-url]
[![Build Status][ci-image]][ci-url]
[![Test Coverage][coverage-image]][coverage-url]
[![Dependency Status][daviddm-image]][daviddm-url]
[![Follow @FabrixApp on Twitter][twitter-image]][twitter-url]

[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

:package: Broadcast Spool

A Spool that implements CQRS/Event Sourcing patterns.

Spool-broadcast helps distribute your Fabrix Applications with a specialized broadcasting pattern over a PubSub and WebSockets.

## Install
```sh
$ npm install --save @fabrix/spool-broadcast
```

Broadcast has a few dependency spools:

```sh
$ npm install --save @fabrix/spool-realtime
$ npm install --save @fabrix/spool-joi
$ npm install --save @fabrix/spool-errors
$ npm install --save @fabrix/spool-sequelize
```

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
}
```
## Definitions
### SAGA
A running pattern that acts as a smart circuit breaker

### Pipelines
An Event Emitter that runs Actions and Commands in a Sequence

### Hooks
Command listeners that will run before or after the SAGA

### Processors
Event listeners that will trigger more events

### Projectors
Event listener that will save data from an event into a projection

![Broadcast Event Loop](https://github.com/fabrix-app/spool-broadcast/blob/master/images/spool-broadcast-event-loop.png)


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
      
  },
  hooks: {
      
  },
  processors: {
        
  },
  projectors: {
        
  }
}
```


## Usage
### BroadcastChannel

### BroadcastPipeline

### BroadcastHook

### BroadcastProcessor

### BroadcastProjector




## Contributing
We love contributions! Please check out our [Contributor's Guide](https://github.com/fabrix-app/fabrix/blob/master/CONTRIBUTING.md) for more
information on how our projects are organized and how to get started.

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

