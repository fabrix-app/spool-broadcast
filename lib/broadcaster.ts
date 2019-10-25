import { FabrixApp } from '@fabrix/fabrix'
import { clone } from 'lodash'
import { utils } from './utils/index'
import { regexdot } from '@fabrix/regexdot'
import { Client } from './Client'
import {BroadcastObjectModel} from './BroadcastObjectModel'

// RabbitMQ TODO make this a generic instead of hardcode
const rabbit = require('rabbot')
// automatically nack exceptions in handlers
rabbit.nackOnError()

export const broadcaster = {

  /**
   * configure - Configure the Broadcasts
   * @param app
   */
  configure: (app: FabrixApp) => {
    // TODO, put this in a transport
    if (app.config.get('log.level') === 'silly') {
      rabbit.log({level: 'debug', stream: process.stdout})
    }
    // rabbit.log(
    //   {level: 'info', stream: app.log.info(process.stdout) },
    //   {level: 'debug', stream: app.log.debug(process.stdout) }
    // )
    // app.spools.broadcast.broadcastTransaction = utils.resolveTransaction

    return
  },

  /**
   * add Model Hooks to models that inherit from BroadcastObjectModel
   * @param app
   */
  addModelHooks: (app: FabrixApp) => {
    Object.keys(app.models).forEach(k => {
      const model = app.models[k]

      if (model instanceof BroadcastObjectModel) {
        // When an instance is saved, consider it as already reloaded
        model.instance.addHook('afterSave', 'isReloaded', (obj, options) => {
          obj.isReloaded = true
          return obj
        })
      }
    })
    return
  },

  /**
   * copyDefaults - Copies the default configuration so that it can be restored later
   * @param app
   * @returns {Promise.<{}>}
   */
  copyDefaults: (app: FabrixApp) => {
    app.config.set('broadcastDefaults', clone(app.config.get('broadcast')))
    return Promise.resolve({})
  },

  /**
   * Build Broadcaster
   */
  buildBroadcaster: (app: FabrixApp) => {
    let broadcasterConfig = app.config.get('broadcast')

    if (broadcasterConfig.enabled === false) {
      return Promise.resolve()
    }

    const profileName = app.config.get('broadcast.profile')
    const profile = utils.getWorkerProfile(profileName, broadcasterConfig)
    broadcasterConfig = utils.configureExchangesAndQueues(profile, broadcasterConfig)

    // Setup the spool broadcaster
    app.spools.broadcast.broadcaster = new Client(app, rabbit, broadcasterConfig.exchangeName)

    // Register the profile broadcasters
    return utils.registerBroadcasts(app, rabbit, profile)
  },

  /**
   * Add Broadcasts to Rabbit
   */
  addBroadcasts: (app: FabrixApp) => {
    let broadcasterConfig = app.config.get('broadcast')

    if (broadcasterConfig.enabled === false) {
      return Promise.resolve()
    }

    rabbit.configure(broadcasterConfig)

    return Promise.resolve()
  },

  /**
   * Discover Channels for Broadcast
   * @param app
   */
  discoverChannels: (app: FabrixApp) => {
    Object.keys(app.broadcasts || {}).forEach(r => {
      Object.keys(app.channels || {}).forEach(p => {
        if (app.channels[p] && app.channels[p].hasBroadcaster(app.broadcasts[r])) {
          app.log.debug(`Adding ${app.channels[p].name} channel to ${app.broadcasts[r].name} broadcaster`)
          app.broadcasts[r].addChannel(app.channels[p])
        }
      })
    })
    return Promise.resolve()
  },

  /**
   * Discover Pipelines for Broadcast
   * @param app
   */
  discoverPipelines: (app: FabrixApp) => {
    Object.keys(app.broadcasts || {}).forEach(r => {
      Object.keys(app.pipelines || {}).forEach(p => {
        if (app.pipelines[p] && app.pipelines[p].hasBroadcaster(app.broadcasts[r])) {
          app.log.debug(`Adding ${app.pipelines[p].name} pipeline to ${app.broadcasts[r].name} broadcaster`)
          app.broadcasts[r].addPipeline(app.pipelines[p])
        }
      })
    })
    return Promise.resolve()
  },

  /**
   * Discover Hooks for Broadcast
   * @param app
   */
  discoverHooks: (app: FabrixApp) => {
    Object.keys(app.broadcasts || {}).forEach(r => {
      Object.keys(app.hooks || {}).forEach(p => {
        if (app.hooks[p] && app.hooks[p].hasBroadcaster(app.broadcasts[r])) {
          app.log.debug(`Adding ${app.hooks[p].name} hook to ${app.broadcasts[r].name} broadcaster`)
          app.broadcasts[r].addHookIn(app.hooks[p])
        }
      })
    })
    //
    return Promise.resolve()
  },

  /**
   * Discover Processors for Broadcast
   * @param app
   */
  discoverProcessors: (app: FabrixApp) => {
    Object.keys(app.broadcasts || {}).forEach(r => {
      Object.keys(app.processors || {}).forEach(p => {
        if (app.processors[p] && app.processors[p].hasBroadcaster(app.broadcasts[r])) {
          app.log.debug(`Adding ${app.processors[p].name} processor to ${app.broadcasts[r].name} broadcaster`)
          app.broadcasts[r].addProcessor(app.processors[p])
        }
      })
    })
    //
    return Promise.resolve()
  },

  /**
   * Discover Projectors for Broadcast
   * @param app
   */
  discoverProjectors: (app: FabrixApp) => {
    Object.keys(app.broadcasts || {}).forEach(r => {
      Object.keys(app.projectors || {}).forEach(p => {
        if (app.projectors[p] && app.projectors[p].hasBroadcaster(app.broadcasts[r])) {
          app.log.debug(`Adding ${app.projectors[p].name} projection to ${app.broadcasts[r].name} broadcaster`)
          app.broadcasts[r].addProjector(app.projectors[p])
        }
      })
    })
    //
    return Promise.resolve()
  },

  makeChannelMap: (app: FabrixApp) => {
    Object.keys((app.broadcasts || {})).forEach(bk => {
      app.spools.broadcast.channelMap.set(
        app.broadcasts[bk].constructor.name,
        app.broadcasts[bk].subscribers()
      )
    })
    return app.spools.broadcast.channelMap
  },

  makePipelineMap: (app: FabrixApp) => {
    Object.keys((app.broadcasts || {})).forEach(bk => {
      app.spools.broadcast.pipelineMap.set(
        app.broadcasts[bk].constructor.name,
        app.broadcasts[bk].pipes()
      )
    })
    return app.spools.broadcast.pipelineMap
  },

  /**
   * Make a map of the connections of projectors
   * @param app
   */
  makeProjectorMap: (app: FabrixApp) => {
    Object.keys((app.broadcasts || {})).forEach(bk => {
      app.spools.broadcast.projectorMap.set(
        app.broadcasts[bk].constructor.name,
        app.broadcasts[bk].events()
      )
    })
    return app.spools.broadcast.projectorMap
  },

  makeHookMap: (app: FabrixApp) => {
    Object.keys((app.broadcasts || {})).forEach(bk => {
      app.spools.broadcast.hookMap.set(
        app.broadcasts[bk].constructor.name,
        app.broadcasts[bk].commands()
      )
    })
    return app.spools.broadcast.hookMap
  },

  makeBroadcastChannelResources: (app: FabrixApp) => {
    app.spools.broadcast.channelMap.forEach((value, key, map) => {
      const channel = app.channels[key]
      if (channel) {
        channel._channel = app.sockets.channel(channel.name)
        channel.initialize()
      }
    })
    return Promise.resolve()
  },

  /**
   * Shutdown Broadcaster
   */
  shutdownBroadcaster: (app: FabrixApp) => {
    let broadcasterConfig = app.config.get('broadcast')

    if (broadcasterConfig.enabled === false) {
      return Promise.resolve()
    }

    return Promise.resolve(rabbit.shutdown())
  },
}
