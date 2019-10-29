import { FabrixApp } from '@fabrix/fabrix'
import { remove, find } from 'lodash'
import { zip } from './zip'
import { merge } from './merge'
import { push } from './push'

import { pattern } from './pattern'

export const utils = {
  ...merge,
  ...push,
  ...zip,
  ...pattern,

  resolveTransaction: (app: FabrixApp, func, req, body, options: {[key: string]: any}) => {
    if (options.transaction) {
      return func(req, body, options)
    }
    else {
      return this.app.spools.sequelize._datastore.transaction(t => {
        options.transaction = t
        return func(req, body, options)
      })
    }
  },
  /**
   * Get the profile for the current process
   * The profile contains a list that this process can work on
   * If there is no profile (ie the current process is not a worker process), this returns undefined
   */
  getWorkerProfile: (profileName, typeConfig) => {
    if (!profileName || !typeConfig.profiles[profileName]) {
      return []
    }

    return typeConfig.profiles[profileName]
  },

  /**
   * This function mutates the broadcasterConfig object
   * Declare the exchanges and queues, and bind them appropriately
   * Define the relevant routing keys
   * @returns {object} - broadcasterConfig
   */
  configureExchangesAndQueues: (profile, broadcasterConfig) => {
    const exchangeName = broadcasterConfig.exchange || 'broadcasts-work-x'
    const workQueueName = broadcasterConfig.work_queue_name || 'broadcasts-work-q'
    const interruptQueueName = broadcasterConfig.interrupt_queue_name || 'broadcasts-interrupt-q'

    broadcasterConfig.exchangeName = exchangeName

    broadcasterConfig.exchanges = [{
      name: exchangeName,
      type: 'topic',
      autoDelete: false
    }]

    broadcasterConfig.queues = [{
      name: workQueueName,
      autoDelete: false,
      subscribe: true
    }, {
      name: interruptQueueName,
      autoDelete: false,
      subscribe: true
    }]

    broadcasterConfig.bindings = [{
      exchange: exchangeName,
      target: workQueueName,
      keys: profile
    }, {
      exchange: exchangeName,
      target: interruptQueueName,
      keys: profile.map(broadcast => broadcast + '.interrupt')
    }]

    return broadcasterConfig
  },

  registerBroadcasts: (app: FabrixApp, rabbit, profile) => {
    app.log.info('Configured Broadcasts', profile)
    profile.forEach(broadcastName => {
      app.broadcaster.active_broadcasts.set(broadcastName, [])
      utils.registerBroadcasters(app, rabbit, broadcastName)
      utils.registerInterrupt(app, rabbit, broadcastName)
    })
  },

  /**
   * Removes the handlers from Client.active_broadcasts
   */
  clearHandler: (activeBroadcasts, broadcast) => {
    // remove the broadcast from the broadcasterClient handlers list
    remove(activeBroadcasts, activeBroadcast => {
      return broadcast.event_uuid = activeBroadcast['event_uuid']
    })
  },

  registerInterrupt: (app: FabrixApp, rabbit, broadcastName: string) => {
    rabbit.handle(`${broadcastName}.interrupt`, message => {
      const broadcastId = message.body.event_uuid
      const activeBroadcasts = app.broadcaster.active_broadcasts.get(broadcastName) || []
      const broadcast = find(activeBroadcasts, activeBroadcast => {
        return activeBroadcast.event_uuid = broadcastId
      })

      if (!broadcast) {
        app.log.info('Failed to interrupt broadcast, no active handler found for broadcast ' +
          broadcastName + ' and id ' + broadcastId)
        return message.reject()
      }

      return broadcast.interrupt(message)
    })
  },

  registerBroadcasters: (app: FabrixApp, rabbit, broadcastName: string) => {
    const broadcaster = app.broadcasts[broadcastName]

    if (!broadcaster) {
      app.log.error(`Attempting to register broadcaster ${broadcastName} but was not found in api/broadcasts`)
      return
    }

    broadcaster.pipelines().forEach((types, command_type) => {
      utils.registerPipelines(app, broadcaster, command_type, types)
    })

    broadcaster.channels().forEach((types, command_type) => {
      utils.registerChannels(app, broadcaster, command_type, types)
    })

    broadcaster.hooks().forEach((types, command_type) => {
      utils.registerHooks(app, broadcaster, command_type, types)
    })

    broadcaster.events().forEach((types, event_type) => {
      const managers = broadcaster.getEventualManagers(event_type)
      utils.registerEventualProjectors(app, rabbit, broadcaster, event_type, types, managers)
    })

    return
  },

  /**
   * Register Pipelines
   * @param app
   * @param broadcaster
   * @param command_type
   * @param types
   */
  registerPipelines: (app: FabrixApp, broadcaster, command_type: string, types) => {
    app.log.debug(`Routing broadcaster ${ broadcaster.name } pipelines for command ${command_type}`)
    return
  },

  /**
   * Register the Before/After hooks for SAGA
   * @param app
   * @param broadcaster
   * @param event_type
   * @param types
   */
  registerChannels: (app: FabrixApp, broadcaster, event_type: string, types) => {
    app.log.debug(`Routing broadcaster ${ broadcaster.name } channels for events ${event_type}`)
    return
  },

  /**
   * Register the Before/After hooks for SAGA
   * @param app
   * @param broadcaster
   * @param command_type
   * @param types
   */
  registerHooks: (app: FabrixApp, broadcaster, command_type: string, types) => {
    app.log.debug(`Routing broadcaster ${ broadcaster.name } hooks for command ${command_type}`)
    return
  },

  /**
   * Register the projectors on RabbitMQ
   * @param app
   * @param rabbit
   * @param broadcaster
   * @param event_type
   * @param types
   * @param managers
   */
  registerEventualProjectors: (app: FabrixApp, rabbit, broadcaster, event_type, types, managers) => {
    const broadcasterClient = app.broadcaster

    const safe_event_type = event_type.replace(':', '_')

    if (types.eventual && types.eventual.size > 0) {
      app.log.debug(`Routing broadcaster ${ broadcaster.name } eventual projectors for event ${event_type}`)

      if (types.eventual.size !== managers.size) {
        app.log.error('Mismatch handlers to managers! Will not listen to:', types.eventual, managers)
        return
      }

      rabbit.handle(`${safe_event_type}`, req => {
        // if (!app.api.broadcasts[broadcastName]) {
        //   app.log.error(`No projector defined for projector event: ${event_type}. event body was:` +
        //     `${JSON.stringify(event.body)}`)
        //   return event.reject()
        // }
        // add the current broadcast type into the list of active broadcasts,
        const promises = []
        if (types.eventual) {
          types.eventual.forEach((project, k) => {
            const manager = managers.get(k)
            if (!manager) {
              throw new app.errors.GenericError(
                'E_UNMET_DEPENDENCY',
                `Event ${event_type} Manager ${project.name} was undefined and will cause a queue backup!`
              )
            }
            promises.push(utils.runProjector(
              app,
              broadcasterClient,
              broadcaster,
              project,
              manager,
              req
            ))
          })
        }
        //
        return Promise.all(promises)
      })
        .catch( function( err, msg ) {
        // do something with the error & message
        app.log.error('Rabbit Handler Error!', err)
        msg.nack()
      })
    }
  },

  onUnhandled(msg) {
    // handle the message here
  },
  onReturned(msg) {
    // Unroutable messages that were published with mandatory: true
  },

  nackUnhandled(msg) {
    // Sends all unhandled messages back to the queue.
  },
  rejectUnhandled(msg) {
    // Rejects unhandled messages so that will will not be requeued. DO NOT use this unless there are dead letter exchanges for all queues.
  },

  /**
   * Run Eventual Projections
   * @param app
   * @param client
   * @param broadcaster
   * @param project
   * @param manager
   * @param message
   */
  runProjector: (app: FabrixApp, client, broadcaster, project, manager, message) => {
    let p

    if (message.fields.redelivered) {
      app.log.warn('Rabbit Message', message.type, 'is being redelivered!')
    }

    const event = app.models.BroadcastEvent.stage(message.body, { isNewRecord: false })

    app.models.BroadcastEvent.sequelize.transaction({
      isolationLevel: app.spools.sequelize._datastore.Transaction.ISOLATION_LEVELS.READ_UNCOMMITTED,
      deferrable: app.spools.sequelize._datastore.Deferrable.SET_DEFERRED
    }, t => {
      try {
        p = project({
          event: event,
          options: { transaction: t }, // This keeps namespace clean for eventual events and they can use their own transaction
          consistency: 'eventual',
          message: message,
          manager: manager
        })
        app.log.debug(event.event_type, 'broadcasted from', broadcaster.name, '->', project.name, '->', p.name)
      }
      catch (err) {
        app.log.error('Utils.runProjector', err)
        return Promise.resolve()
      }

      if (!client.active_broadcasts.has(broadcaster.name)) {
        const err = new Error(`Client should have active_broadcast of ${broadcaster.name}`)
        app.log.error('Utils.runProjector', err)
        return Promise.resolve()
      }
      if (typeof p.run !== 'function') {
        const err = new Error(`${broadcaster.name} ${p.name} should have a run function!`)
        app.log.error('Utils.runProjector', err)
        return Promise.resolve()
      }
      if (typeof p.ack !== 'function') {
        const err = new app.errors.GenericError('E_BAD_REQUEST', `${broadcaster.name} ${p.name} should have an ack function!`)
        app.log.error('Utils.runProjector', err)
        return Promise.resolve()
      }

      // so we know who should handle an interrupt call
      client.active_broadcasts
        .get(broadcaster.name)
        .push(p)

      return Promise.resolve()
        .then(() => {
          return p.run()
            .then(([_event, _options]) => {
              return p.ack()
            })
        })
        .catch(err => {
          app.log.error(`Error in project.run() for project ${p.name}`, err)
          return p.reject()
        })
        .then(() => {
          return p.finalize()
            .then(() => {
              return utils.clearHandler(client.active_broadcasts.get(broadcaster.name), p)
            })
            .catch(() => {
              return utils.clearHandler(client.active_broadcasts.get(broadcaster.name), p)
            })
        })
    })
  },


  BreakException: {},

  /**
   * Supplied by Model vs Recognized by Sequelize
   * Used to generate a "type" for buffer 'Type'
   */
  dataTypes: {
    '^(STRING|string)': 'string',
    '^(STRING|string)\((\w*)\)': 'string',
    '(STRING.BINARY)': 'Buffer',
    '^(TEXT|text)': 'string',
    '^(TEXT|text)\((\w*)\)': 'string',
    '^(INTEGER|integer|int)': 'int',
    '^(BIGINT)': 'int',
    '^(BIGINT)\((\d*)\)': 'int',
    '^(FLOAT)': 'float',
    '^(FLOAT)\((\d*)\)': 'float',
    '^(FLOAT)\((\d*),\s(\d*)\)': 'float',
    '^(REAL)': 'REAL',
    '^(REAL)\((\d*)\)': 'REAL($2)',
    '^(REAL)\((\d*),\s(\d*)\)': 'REAL($2, $3)',
    '^(DOUBLE)': 'DOUBLE',
    '^(DOUBLE)\((\d*)\)': 'DOUBLE($2)',
    '^(DOUBLE)\((\d*),\s(\d*)\)': 'DOUBLE($2, $3)',
    '^(DECIMAL)': 'float',
    '^(DECIMAL)\((\d*),\s(\d*)\)': 'float',
    '^(DATE|date)': 'date',
    '^(DATE)\((\d*)\)': 'date',
    '^(DATEONLY)': 'date',
    '^(BOOLEAN)': 'boolean',
    '^(ENUM)': 'string',
    '^(ENUM)\((.*)?\)': 'string',
    '^(ARRAY)\((\w*)\)': '[$2]',
    '^(JSON|json)': 'json',
    '^(JSONB|jsonb)': 'json',
    '^(BLOB)': 'Buffer',
    '^(BLOB)\((\w*)\)': 'Buffer',
    '^(UUID)': 'string',
    '^(CIDR)': 'string',
    '^(INET)': 'string',
    '^(MACADDR)': 'string',
    '^(RANGE)\((\w*)\)': 'string',
    '^(GEOMETRY)': 'string',
    '^(GEOMETRY)\((\w*)\)': 'string',
    '^(GEOMETRY)\((\w*),\s(\d*)\)': 'string'
  },

  /**
   * A utility to convert unspecified binary types by their sequelize conterpart
   * @param app
   * @param dataType
   */
  replaceDataType: (app: FabrixApp, dataType: string) => {
    let transformed
    try {
      Object.keys(utils.dataTypes).forEach(type => {
        const exp = new RegExp(type)
        if (exp.test(dataType)) {
          transformed = app.spools.sequelize._datastore[dataType.replace(exp, utils.dataTypes[type])]
          throw utils.BreakException
        }
      })
    }
    catch (e) {
      if (e !== utils.BreakException) {
        throw e
      }
    }
    return transformed
  }
}
