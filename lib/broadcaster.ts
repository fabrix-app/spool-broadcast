import { FabrixApp } from '@fabrix/fabrix'
import { clone } from 'lodash'
import { utils } from './utils/index'
import { regexdot } from '@fabrix/regexdot'
import { Client } from './Client'
import { BroadcastObjectModel } from './BroadcastObjectModel'

// RabbitMQ TODO make this a generic instead of hardcode
// Many different spools have rabbot, we don't want those getting crossed
import rabbit from 'rabbot'

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

    // automatically nack exceptions in handlers
    // rabbit.nackOnError()

    // automatically reject exceptions in handlers
    // rabbit.rejectUnhandled()

    broadcaster.registerOnUnhandled(app, rabbit)
    broadcaster.registerOnReturned(app, rabbit)

    return
  },

  registerOnUnhandled(app: FabrixApp, _rabbit: rabbit) {
    //
    _rabbit.onUnhandled(function (message ) {
      utils.onUnhandled(app, message)
    })
    return _rabbit
  },

  registerOnReturned(app: FabrixApp, _rabbit: rabbit) {
    //
    _rabbit.onReturned(function (message) {
      utils.onReturned(app, message)
    })
    return _rabbit
  },
  // registerNackUnhandled(app: FabrixApp, _rabbit) {
  //   //
  //   _rabbit.nackUnhandled(function (message ) {
  //     utils.nackUnhandled(app, message)
  //   })
  //   return _rabbit
  // },
  // registerUnhandled(app: FabrixApp, _rabbit) {
  //
  //   _rabbit.registerUnhandled(function (message ) {
  //     utils.registerUnhandled(app, message)
  //   })
  //   return _rabbit
  // },


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
    app.spools.broadcast.broadcaster = new Client(app, rabbit, broadcasterConfig)

    // Register the profile broadcasters
    return utils.registerBroadcasts(app, rabbit, profile, broadcasterConfig)
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

  // Build a small non-functional map of all the channels
  makeChannelMap: (app: FabrixApp) => {
    Object.keys((app.broadcasts || {})).forEach(bk => {
      app.spools.broadcast.channelMap.set(
        app.broadcasts[bk].constructor.name,
        new Map()
      )
      const channels = app.broadcasts[bk].channels()
      channels.forEach(channel => {
        app.spools.broadcast.channelMap.get(app.broadcasts[bk].constructor.name).set(channel.name, channel.subscribers)
      })
    })
    return app.spools.broadcast.channelMap
  },

  // Build a small non-functional map of all the pipelines
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
    // Object.keys((app.broadcasts || {})).forEach(bk => {
    //   app.spools.broadcast.projectorMap.set(
    //     app.broadcasts[bk].constructor.name,
    //     app.broadcasts[bk].projectors()
    //   )
    // })
    // return app.spools.broadcast.projectorMap

    Object.keys((app.broadcasts || {})).forEach(bk => {
      app.spools.broadcast.projectorMap.set(
        app.broadcasts[bk].constructor.name,
        new Map()
      )
      const projectors = app.broadcasts[bk].projectors()
      projectors.forEach(projector => {
        app.spools.broadcast.projectorMap.get(app.broadcasts[bk].constructor.name).set(projector.name, projector.managers)
      })
    })
    return app.spools.broadcast.projectorMap
  },

  // Build a small non-functional map of all the processors
  makeProcessorMap: (app: FabrixApp) => {
    // Object.keys((app.broadcasts || {})).forEach(bk => {
    //   app.spools.broadcast.processorMap.set(
    //     app.broadcasts[bk].constructor.name,
    //     app.broadcasts[bk].processors()
    //   )
    // })
    // return app.spools.broadcast.projectorMap

    Object.keys((app.broadcasts || {})).forEach(bk => {
      app.spools.broadcast.processorMap.set(
        app.broadcasts[bk].constructor.name,
        new Map()
      )
      const processors = app.broadcasts[bk].processors()
      processors.forEach(processor => {
        app.spools.broadcast.processorMap.get(app.broadcasts[bk].constructor.name).set(processor.name, processor.managers)
      })
    })
    return app.spools.broadcast.processorMap
  },

  // Build a small non-functional map of all the hooks
  makeHookMap: (app: FabrixApp) => {
    // Object.keys((app.broadcasts || {})).forEach(bk => {
    //   app.spools.broadcast.hookMap.set(
    //     app.broadcasts[bk].constructor.name,
    //     app.broadcasts[bk].commands()
    //   )
    // })
    // return app.spools.broadcast.hookMap

    Object.keys((app.broadcasts || {})).forEach(bk => {
      app.spools.broadcast.hookMap.set(
        app.broadcasts[bk].constructor.name,
        new Map()
      )
      const hooks = app.broadcasts[bk].hooks()
      hooks.forEach(hook => {
        app.spools.broadcast.hookMap.get(app.broadcasts[bk].constructor.name).set(hook.name, hook.handlers)
      })
    })
    return app.spools.broadcast.hookMap
  },

  /**
   * Gather all the Channels attached to the Broadcaster and add Primus to them
   * @param app
   */
  makeBroadcastChannelResources: (app: FabrixApp) => {
    Object.keys(app.channels).forEach((value, key) => {
      const channel = app.channels[value]
      const broadcasters = channel.broadcasters

      if (channel) {
        channel.initialize()

        channel._channel = app.sockets.on('connection', function (spark) {

          spark.on('disconnection', function(data) {
            channel.disonnect(spark, data)
          })

          spark.on('data', function(data) {
            // Handle the Spark subscribing
            if (
              data
              && data.channel
              && data.subscribe
              && data.subscribe.length > 0
              && data.channel === channel.name
            ) {
              const _channel = data.channel
              const subscribe = data.subscribe

              const _rooms = subscribe.map(ev => {
                return `${_channel}.${ev}`
              })

              _rooms.forEach(room => {
                // check if spark is already in this room
                if (spark.rooms().includes(room)) {

                }
                else {
                  // join the room
                  spark.join(room, function() {
                    channel.subscribed(spark, room)
                  })
                }
              })

              spark.write({
                subscribed: spark.rooms()
              })
            }

            else if (
              data
              && data.channel
              && data.unsubscribe
              && data.unsubscribe.length > 0
              && data.channel === channel.name
            ) {

              const _channel = data.channel
              const unsubscribe = data.unsubscribe

              const _rooms = unsubscribe.map(ev => {
                return `${_channel}.${ev}`
              })

              _rooms.forEach(room => {
                // check if spark is already in this room
                if (spark.rooms().includes(room)) {
                  spark.leave(room, function() {
                    channel.unsubscribed(spark, room)
                  })
                }
                else {

                }
              })

              spark.write({
                unsubscribed: _rooms,
                subscribed: spark.rooms()
              })
            }
          })
        })
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

    app.log.debug(
      'still active, need to move to interrupt',
      app.broadcaster.active_broadcasts
    )

    // interrupt active broadcasts
    const active: Promise<any>[] = []

    app.broadcaster.active_broadcasts.forEach((value, key, map) => {
      value.forEach((projector) => {
        if (projector && projector.message && projector.message.interrupt) {
          active.push(projector.message.interupt())
        }
      })
    })

    // Await the resolution of each of the interrupt calls
    // Each of these is in a transaction, so we don't have to be super polite
    return Promise.all(active)
      .then(res => {
        return rabbit.shutdown()
      })
  },
}
