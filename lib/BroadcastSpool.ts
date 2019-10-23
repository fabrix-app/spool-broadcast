import { ExtensionSpool } from '@fabrix/fabrix/dist/common/spools/extension'
import { broadcaster } from './broadcaster'
import { Validator } from './validator'
import { utils } from './utils/index'

import * as config from './config/index'
import * as api from './api/index'
import { FabrixApp } from '@fabrix/fabrix'
import { Entry } from './Entry'
import { FabrixModel } from '@fabrix/fabrix/dist/common'
import { ConfigError } from './errors'

export class BroadcastSpool extends ExtensionSpool {
  public broadcaster

  public channelMap = new Map()
  public pipelineMap = new Map()
  public hookMap = new Map()
  public processorMap = new Map()
  public projectorMap = new Map()

  constructor(app) {
    super(app, {
      config: config,
      pkg: {
        name: 'spool-broadcast'
      },
      api: api
    })

    this.extensions = {
      broadcaster: {
        get: () => {
          return this.broadcaster
        },
        set: (newInstances) => {
          throw new Error('broadcaster can not be set through FabrixApp, check spool-broadcaster instead')
        },
        enumerable: true,
        configurable: true
      },
      // entrypoints: {
      //   get: () => {
      //     return this.app.entries
      //   },
      //   set: (newInstances) => {
      //     throw new Error('entries can not be set through FabrixApp, check spool-broadcaster instead')
      //   },
      //   enumerable: true,
      //   configurable: true
      // }
    }
  }

  transaction(func, req, body, options: {[key: string]: any} = {}) {
    if (typeof func !== 'function') {
      throw new Error(`transaction ${func} is not a function`)
    }
    if ( options.transaction === false || this.app.config.get('broadcast.auto_transaction') === false) {
      return func(req, body, options)
    }
    else {
      if (!this.app.models.BroadcastEvent.sequelize) {
        throw new Error('Sequelize is not available on BroadcastEvent!')
      }
      if (options.parent && options.parent.transaction) {
        return this.app.models.BroadcastEvent.sequelize.transaction({transaction: options.parent.transaction}, t => {
          options.transaction = t
          this.app.log.debug(`Broadcast adding transaction ${t.id} to parent ${options.parent.transaction.id}`)
          return func(req, body, options)
        })
      }
      else if (options.transaciton) {
        this.app.log.debug(`Broadcast on same transaction ${options.transaction.id}`)
        return func(req, body, options)
      }
      else {
        return this.app.models.BroadcastEvent.sequelize.transaction({
          isolationLevel: this.app.spools.sequelize._datastore.Transaction.ISOLATION_LEVELS.READ_UNCOMMITTED,
          deferrable: this.app.spools.sequelize._datastore.Deferrable.SET_DEFERRED
        }, t => {
          options.transaction = t
          this.app.log.debug(`Broadcast new transaction ${options.transaction.id}`)
          return func(req, body, options)
        })
      }
    }
  }

  /**
   * Temporary until the distributed Model resolver is completed
   * Get's a model by name
   * @param name
   */
  models(name: string): FabrixModel {
    if (!name || !this.app.models[name]) {
      throw new Error(`${name} is not a valid model`)
    }
    return this.app.models[name]
  }
  /**
   * Temporary until the distributed Entries resolver is completed
   * Get's a model by name
   * @param name
   */
  entries(name: string): Entry {
    if (!name || !this.app.entries[name]) {
      throw new Error(`${name} is not a valid entry`)
    }
    return this.app.entries[name]
  }

  /**
   * Validates Configs
   */
  async validate () {

    const requiredSpools = [
      'sequelize',
      'realtime',
      'errors'
    ]

    const oneOfSpools = [
      'express',
      'polka',
      'hapi'
    ]

    const spools = Object.keys(this.app.spools)

    if (!spools.some(v => requiredSpools.indexOf(v) === -1)) {
      return Promise.reject(new ConfigError(
        'E_PRECONDITION_FAILED',
        `spool-broadcast requires spools: ${ requiredSpools.join(', ') }!`)
      )
    }

    if (!spools.some(v => oneOfSpools.indexOf(v) === -1)) {
      return Promise.reject(new ConfigError(
        'E_PRECONDITION_FAILED',
        `spool-broadcast requires at least one of spools: ${ oneOfSpools.join(', ') }!`)
      )
    }

    if (!this.app.config.get('broadcast')) {
      return Promise.reject(new ConfigError(
        'E_PRECONDITION_FAILED',
        'No configuration found at config.broadcast!')
      )
    }

    if (!this.app.config.get('realtime')) {
      return Promise.reject(new ConfigError(
        'E_PRECONDITION_FAILED',
        'No configuration found at config.realtime!')
      )
    }

    // Configs
    return Promise.all([
      Validator.validateBroadcastConfig(this.app.config.get('broadcast')),
      Validator.validateRealtimeConfig(this.app.config.get('realtime'))
    ])
      .catch(err => {
        return Promise.reject(err)
      })
  }

  /**
   * Adds Routes, Policies, and Agenda
   */
  async configure () {
    await Promise.all([
      broadcaster.configure(this.app),
      broadcaster.discoverChannels(this.app),
      broadcaster.discoverPipelines(this.app),
      broadcaster.discoverHooks(this.app),
      broadcaster.discoverProjectors(this.app),
      broadcaster.discoverProcessors(this.app),
      broadcaster.buildBroadcaster(this.app),
      broadcaster.addModelHooks(this.app),
      broadcaster.copyDefaults(this.app)
    ])
      .catch(err => {
        return Promise.reject(err)
      })
  }

  /**
   * TODO document method
   */
  async initialize () {
    // Make the all the maps
    await Promise.all([
      broadcaster.addBroadcasts(this.app),
      broadcaster.makeChannelMap(this.app),
      broadcaster.makePipelineMap(this.app),
      broadcaster.makeHookMap(this.app),
      broadcaster.makeProjectorMap(this.app)
    ])
      .then((maps) => {
        // Make the broadcast resources
        return broadcaster.makeBroadcastChannelResources(this.app)
      })
      .catch(err => {
        return Promise.reject(err)
      })
  }

  /**
   * clear subscriptions
   */
  async unload() {
    return Promise.all([
      broadcaster.shutdownBroadcaster(this.app)
    ])
      .catch(err => {
        return Promise.reject(err)
      })
  }

  async sanity() {
    this.app.log.silly('BroadcastChannel Map', this.channelMap)
    this.app.log.silly('Pipeline Map', this.pipelineMap)
    this.app.log.silly('Hook Map', this.hookMap)
    this.app.log.silly('Projection Map', this.projectorMap)
    return Promise.resolve()
  }
}

