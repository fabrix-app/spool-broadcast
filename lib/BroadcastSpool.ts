import { ExtensionSpool } from '@fabrix/fabrix/dist/common/spools/extension'
import { broadcaster } from './broadcaster'
import { Validator } from './validator'
import { utils } from './utils/index'

import * as config from './config/index'
import * as api from './api/index'

export class BroadcastSpool extends ExtensionSpool {
  public broadcaster

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
  models(name) {
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
  entries(name) {
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
      'realtime'
    ]

    const spools = Object.keys(this.app.spools)

    if (!spools.some(v => requiredSpools.indexOf(v) >= 0)) {
      return Promise.reject(new Error(`spool-broadcast requires spools: ${ requiredSpools.join(', ') }!`))
    }

    if (!this.app.config.get('broadcast')) {
      return Promise.reject(new Error('No configuration found at config.broadcast!'))
    }

    // Configs
    return Promise.all([
      Validator.validateBroadcastConfig(this.app.config.get('broadcast'))
    ])
      .catch(err => {
        return Promise.reject(err)
      })
  }

  /**
   * Adds Routes, Policies, and Agenda
   */
  async configure () {
    return Promise.all([
      broadcaster.configure(this.app),
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
    return Promise.all([
      broadcaster.addBroadcasts(this.app),
      broadcaster.makeProjectorMap(this.app)
    ])
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
    //
    this.app.log.silly('Projection Map', this.projectorMap)
    return Promise.resolve()
  }
}

