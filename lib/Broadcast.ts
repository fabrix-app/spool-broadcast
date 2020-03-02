import { FabrixApp } from '@fabrix/fabrix'
import { FabrixGeneric, FabrixModel } from '@fabrix/fabrix/dist/common'
import { get, isArray, uniq, uniqBy } from 'lodash'
import joi from '@hapi/joi'
import { regexdot } from '@fabrix/regexdot'
import { projectorConfig, processorConfig, hookConfig, pipeConfig, subscriberConfig } from './schemas'

import { BroadcastHook, BroadcastHookIn } from './BroadcastHook'
import { BroadcastPipeline, BroadcastPipe, PipelineEmitter } from './BroadcastPipeline'
import { BroadcastChannel, BroadcastSubscriber } from './BroadcastChannel'
import { BroadcastProject, BroadcastProjector } from './BroadcastProjector'
import { BroadcastProcessor } from './BroadcastProcesser'
import { BroadcastEvent } from './api/models'
import { BroadcastCommand } from './BroadcastCommand'
import { GenericError } from '@fabrix/spool-errors/dist/errors'
import { utils } from './utils'

// import { each, broadcastSeries } from 'Bluebird'


export class Broadcast extends FabrixGeneric {

  // Types of Hooks
  public lifecycles = ['before', 'after']
  // Types of Subscribers
  public lifespans = ['ephemeral', 'eternal']
  // Types of Events
  public consistencies = ['strong', 'eventual']
  // Types of Event Processing
  public processing = ['serial', 'parallel']


  /**
   * Pipelines
   */
  private _pipelines: Map<string, BroadcastPipeline> = new Map()
  private _pipes: Map<string, { [key: string]: Map<string, any> }> = new Map()
  private _runners: Map<string, { [key: string]: Map<string, any> }> = new Map()

  /**
   * Hooks
   */
  private _hooks: Map<string, BroadcastHookIn> = new Map()
  private _commands: Map<any, { [key: string]: Map<string, any> }> = new Map()
  private _handlers: Map<any, { [key: string]: Map<string, any> }> = new Map()

  /**
   * Processors/Projectors
   */
  private _processors: Map<string, BroadcastProcessor> = new Map()
  private _projectors: Map<string, BroadcastProjector> = new Map()
  private _events: Map<any, { [key: string]: Map<string, any> }> = new Map()
  private _managers: Map<any, { [key: string]: Map<string, any> }> = new Map()

  /**
   * Broadcast Channels
   */
  private _channels: Map<string, BroadcastChannel> = new Map()
  private _subscribers: Map<any, { [key: string]: Map<string, any> }> = new Map()
  private _brokers: Map<any, { [key: string]: Map<string, any> }> = new Map()


  /**
   * Get's the name of the Broadcast class
   */
  get name() {
    return this.constructor.name
  }

  /**
   * Run a Pipeline
   * TODO may be renamed
   * @param command
   * @param req
   * @param body
   * @param options
   */
  subscribe(command, req = {}, body = {}, options = {}) {

    if (!this._pipes.has(command)) {
      throw new Error(`${command} is not a valid pipeline for ${this.name}`)
    }

    return new PipelineEmitter(
      this.app,
      command,
      this._pipes.get(command),
      this._runners.get(command),
      req,
      body,
      options
    )
    // .setMaxListeners(1)
  }

  /**
   * Run Serial TODO or in Parallel
   * Sequelize transactions can not run in parallel, if using transaction management, then this
   * must always run in Serial
   * @param managers
   * @param args
   */
  process(managers, ...args) {

    // return args.reduce((promiseChain, currentTask) => {
    //   return promiseChain.then(chainResults =>
    //     currentTask.then(currentResult =>
    //       [ ...chainResults, currentResult ]
    //     )
    //   )
    // }, Promise.resolve([])).then(arrayOfResults => {
    //   // Do something with all results
    //   return arrayOfResults
    // })

    return this.app.broadcastSeries(...args)
      .catch(err => {
        this.app.log.err('Fatal BroadcastProcess', err)
        return Promise.reject(err)
      })
  }

  reverseProcess(managers, ...args) {
    return this.app.broadcastSeries(...args)
      .catch(err => {
        this.app.log.err('Fatal BroadcastProcess', err)
        return Promise.reject(err)
      })
  }

  /**
   * Create a command
   * @param command
   * @param options
   */
  createCommand(command, options) {
    return new BroadcastCommand(this.app, this, command, options)
  }

  /**
   * Update a command
   * Sets a correlation ID and returns a new command
   * @param command
   * @param options
   */
  updateCommand(command, options) {
    return new BroadcastCommand(this.app, this, {correlation_uuid: command.command_uuid, ...command}, options)
  }

  /**
   * Build Event from command information
   * @param event_type
   * @param correlation_uuid
   * @param correlation_pattern,
   * @param correlation_pattern_raw,
   * @param causation_uuid
   * @param command
   * @param chain_before
   * @param chain_saga
   * @param chain_after
   * @param chain_events
   */
  // TODO handle version
  buildEvent({
     command,
     event_type,
     correlation_uuid,
     correlation_pattern,
     correlation_pattern_raw,
     causation_uuid,
     chain_before,
     chain_saga,
     chain_after,
     chain_events
  }: {
    command: BroadcastCommand,
    // Overrides
    event_type?: string,
    correlation_uuid: string,
    causation_uuid?: string,
    correlation_pattern?: RegExp,
    correlation_pattern_raw?: string,
    chain_before?: string[],
    chain_saga?: string[],
    chain_after?: string[],
    chain_events?: string[]
  }) {
    if (!event_type) {
      throw new Error('Broadcast.buildEvent missing event_type')
    }
    if (!correlation_uuid) {
      throw new Error('Broadcast.buildEvent missing correlation_uuid')
    }
    if (!(command instanceof BroadcastCommand)) {
      throw new Error('Broadcast.buildEvent called with a non Command object')
    }

    // Create the event_type patterns and make a "raw" alias as a pointer
    const { pattern, keys } = regexdot(event_type)
    const pattern_raw = event_type

    // Replace any parameters in the event_type with the data
    event_type = this.replaceParams(event_type, keys, command.data)

    // Create the data for the Event Model
    const data = {
      event_type, // || command.event_type,
      // This is the command uuid that started this event chain
      correlation_uuid,
      // This is the REGEX pattern that the command used
      correlation_pattern: correlation_pattern || command.pattern,
      // This is the string pattern that the command used
      correlation_pattern_raw: correlation_pattern_raw || command.pattern_raw,
      // The causation_uuid my have been part of a another new event (processor dispatched)
      causation_uuid: causation_uuid || command.causation_uuid,
      // report list of functions that ran before this event's saga (combined)
      chain_before: chain_before || command.chain_before,
      // report list of functions that ran during this event's saga (combined)
      chain_saga: chain_saga || command.chain_saga,
      // report list of functions that ran after this event's saga (combined)
      chain_after: chain_after || command.chain_after,
      // report list of functions that ran before this event's saga (combined)
      chain_events: chain_events || command.chain_events,
      // All the information from the command
      ...command,
      // the event_type REGEX pattern
      pattern: pattern,
      // the event_type string pattern
      pattern_raw: pattern_raw
    }

    // Stage the Event as a new BroadcastEvent ready to be run
    return this.app.models.BroadcastEvent.stage(data, {
      isNewRecord: true
    })
      .generateUUID()
  }

  /**
   * Utility to replace pattern variables with data values
   * @param type
   * @param keys
   * @param object
   */
  replaceParams(type = '', keys: boolean | string[] = [], object: any = {}) {

    if (
      keys !== false
      && typeof keys !== 'boolean'
      && isArray(keys)
    ) {
      if (!isArray(object)) {
        keys.forEach(k => {
          if (k && object && object[k]) {
            type = type.replace(`:${k}`, `${object[k]}`)
          }
        })
      }
      else if (isArray(object)) {
        // TODO
        const o = object[0]
        keys.forEach(k => {
          if (k && o && o[k]) {
            type = type.replace(`:${k}`, `${o[k]}`)
          }
        })
      }
    }

    return type
  }

  /**
   * Call toJSON on each "Sequelize Model" to make it a normal JS object
   * @param obj
   * @private
   */
  _cleanObj(obj) {
    const cleanObj = isArray(obj)
      ? obj.map(d => d.toJSON ? d.toJSON() : d)
      : obj.toJSON
        ? obj.toJSON()
        : obj

    return JSON.parse(JSON.stringify(cleanObj))
  }

  /**
   * Run provided validator over command data that is cleaned to JSON throws spool-error standard on failure
   * @param validators
   * @param command
   * @param options
   */
  validate(validators = [], command, options) {

    const _value = this._cleanObj(command.data)

    return Promise.all(validators.map((v, k) => {
      const validator: any = Object.values(v)[0]
      const name: string = Object.keys(v)[0]
      this.app.log.debug(`validating ${command.command_type} with ${name} schema`)

      return validator(_value)
    }))
      .then((data) => {
        // Returns the unmodified version
        return [command, options]
      })
      .catch(error => {
        this.app.log.debug(`validating error ${command.command_type}`)
        const err = this.app.transformJoiError({ value: _value, error })
        return Promise.reject(err)
      })
  }

  /**
   * Run Sequence of Hooks before 3rd Party SAGA
   * @param command
   * @param options
   * @param validators
   */
  before(command: BroadcastCommand, options, validators) {
    if (!(command instanceof BroadcastCommand)) {
      throw new this.app.errors.GenericError(
        'E_FAILED_DEPENDENCY',
        'command is not an instance of Command'
      )
    }
    return this.beforeCommand(command, options, validators)
      .catch((err) => {
        this.app.log.error(`${this.name} Failure before ${command.command_type} - fatal`, err)
        // TODO reverse SAGA
        return [command, options]
      })
  }

  /**
   * Run Sequence of Hooks after 3rd Party SAGA
   * @param command
   * @param options
   * @param validators
   */
  after(command: BroadcastCommand, options, validators) {
    if (!(command instanceof BroadcastCommand)) {
      throw new Error('command is not an instance of Command')
    }
    return this.afterCommand(command, options, validators)
      .catch((err) => {
        this.app.log.error(`${this.name} Failure after ${command.command_type} - fatal`, err)
        // TODO reverse SAGA
        return [command, options]
      })
  }

  /**
   * Before a command heads to 3rd parties
   * @param command
   * @param options
   * @param validators
   */
  beforeCommand(command: BroadcastCommand, options, validators) {

    const beforeHooks = this.getBeforeHooks(command.command_type)
    const beforeHandlers = this.getBeforeHandlers(command.command_type)

    if (!beforeHooks || !beforeHandlers) {
      const err = new this.app.errors.GenericError(
        'E_PRECONDITION_REQUIRED',
        'Before Commands/Handlers are not defined'
      )
      return Promise.reject(err)
    }
    return this.runBefore(beforeHooks, beforeHandlers, command, options, validators)
  }

  /**
   * After a command heads to 3rd parties
   * @param command
   * @param options
   * @param validators
   */
  afterCommand(command: BroadcastCommand, options, validators) {

    const afterHooks = this.getAfterHooks(command.command_type)
    const afterHandlers = this.getAfterHandlers(command.command_type)

    if ( !afterHooks || !afterHandlers) {
      const err = new this.app.errors.GenericError(
        'E_PRECONDITION_REQUIRED',
        'After Commands/Handler are not defined'
      )
      return Promise.reject(err)
    }
    return this.runAfter(afterHooks, afterHandlers, command, options, validators)
  }

  /**
   * Run the Before Commands
   * @param beforeCommands
   * @param beforeHandlers
   * @param command
   * @param options
   * @param validators
   */
  runBefore(beforeCommands, beforeHandlers, command, options, validators) {
    let breakException
    // Setup Before Commands in priority order
    const beforeCommandsAsc = new Map([...beforeCommands.entries()].sort((a, b) => {
      return beforeHandlers
        .get(a[0]).priority - beforeHandlers.get(b[0]).priority
    }))
    // Log the order
    const slog = []
    beforeCommandsAsc.forEach((v, k) => slog.push(k))

    this.app.log.debug(
      `Broadcaster ${this.name} running`,
      `${beforeCommandsAsc.size} before hooks for command ${command.command_type}`,
      `-> ${slog.map(k => k).join(' -> ')}`
    )

    const promises = Array.from(beforeCommandsAsc.entries())

    // confirm the tracer
    options.trace = options.trace ? options.trace : new Map()

    return this.process(beforeHandlers, promises, ([m, p]) => {
      if (breakException) {
        return Promise.reject(breakException)
      }
      const handler = beforeHandlers.get(m)

      const trace = options.trace.set(`${handler.pattern_raw}::${handler.type}::${m}`, handler)
      // options.trace.set(m, handler)

      // Check and promise commands
      if (!p || typeof p !== 'function') {
        this.app.log.error(`${this.name}: ${m} attempted to call a non function ${p}! - returning`)
        return [command, options]
      }

      // Get the time for the start of the hook
      const hookstart = process.hrtime()

      return p({
        command,
        options,
        lifecycle: 'before',
        handler: handler
      })
        .run()
        .then(([_command, _options]) => {
          if (!_command) { // || !_command.data) {
            throw new this.app.errors.GenericError(
              'E_FAILED_DEPENDENCY',
              `${this.name}: ${p.name} Hook returned invalid response for ${m}! - fatal`
            )
          }
          if (!(_command instanceof BroadcastCommand)) {
            throw new this.app.errors.GenericError(
              'E_FAILED_DEPENDENCY',
              `${this.name}: ${p.name} Hook returned a Command instead of an Command for ${m}! - fatal`
            )
          }
          if (_command.action && _command.action === 'retry') {
            this.app.log.warn(`${this.name}: ${p.name} BRK currently unhandled retry action for ${m}`)
            return [command, options]
          }
          if (_command.action === false) {
            this.app.log.debug(`${m} to continue without data`)
            return [command, options]
          }

          // Validate after the step
          return this.validate(validators, _command, options)
            .catch(err => {
              this.app.log.error(
                `${this.name}: Before Handler ${m} failed validation for ${command.command_type}`,
                err
              )
              return Promise.reject(err)
            })
        })
        .then(([_command, _options]) => {

          command.chain_before.push(m)

          // const handler = beforeHandlers.get(m)

          if (handler && handler.merge && handler.merge !== false) {
            command.mergeData(m, handler, _command)
          }

          if (handler && handler.push && handler.push !== false) {
            command.pushOn(m, handler, _command)
          }

          if (handler && handler.zip && handler.zip !== false) {
            command.zip(m, handler, _command)
          }

          if (handler && handler.include && handler.include !== false) {
            command.includeOn(m, handler, _command)
            this.app.log.debug(`${this.name}: Before Handler ${m} included data on ${handler.include}`)
          }

          if (handler.data) {
            command.handleData(m, handler, _command)
          }
          if (handler.metadata) {
            command.handleMetadata(m, handler, _command)
          }

          command.complete = true

          const hookend = process.hrtime(hookstart)
          this.app.log.debug(
            `${this.name}.${m}: ${_command.command_type} Before Hook Execution time (hr): ${hookend[0]}s ${hookend[1] / 1000000}ms`
          )

          return [command, options]
        })
        .catch(err => {
          command.breakException = breakException = err
          // TODO perhaps retry up to a limit?
          this.app.log.error(`${p.name} threw an error - fatal`, err)
          return Promise.reject(err)
        })
    })
      .then(results =>  [command, options])
  }


  /**
   * Run the After Commands
   * @param afterCommands
   * @param afterHandlers
   * @param command
   * @param options
   * @param validators
   */
  runAfter(afterCommands, afterHandlers, command, options, validators) {
    let breakException
    // Setup After Commands in priority order
    const afterCommandsAsc = new Map([...afterCommands.entries()]
      .sort((a, b) => {
        return afterHandlers
          .get(a[0]).priority - afterHandlers.get(b[0]).priority
      }))

    // Log the order
    const slog = []
    afterCommandsAsc.forEach((v, k) => slog.push(k))

    this.app.log.debug(
      `Broadcaster ${this.name} running`,
      `${afterCommandsAsc.size} after hooks for command ${command.command_type}`,
      `-> ${slog.map(k => k).join(' -> ')}`
    )

    // Build an array of promises
    const promises = Array.from(afterCommandsAsc.entries())

    // confirm the tracer
    options.trace = options.trace ? options.trace : new Map()

    return this.process(afterHandlers, promises, ([m, p]) => {
      if (breakException) {
        return Promise.reject(breakException)
      }
      const handler = afterHandlers.get(m)

      const trace = options.trace.set(`${handler.pattern_raw}::${handler.type}::${m}`, handler)
      // options.trace.set(m, handler)

      // Check and promise commands
      if (!p || typeof p !== 'function') {
        this.app.log.error(`${m} attempted to call a non function ${p}! - returning`)
        return [command, options]
      }

      // Get the time for the start of the hook
      const hookstart = process.hrtime()

      return p({
        command,
        options,
        lifecycle: 'after',
        handler: handler
      })
        .run()
        .then(([_command, _options]) => {
          if (!_command) { // || !_command.data) {
            throw new this.app.errors.GenericError(
              'E_FAILED_DEPENDENCY',
              `${p.name} Hook returned invalid response for ${m}! - fatal`
            )
          }
          if (!(_command instanceof BroadcastCommand)) {
            throw new this.app.errors.GenericError(
              'E_FAILED_DEPENDENCY',
              `${p.name} Hook returned a Command instead of an Command for ${m}! - fatal`
            )
          }
          if (_command.action && _command.action === 'retry') {
            this.app.log.warn(`${p.name} BRK unhandled retry action for ${m}`)
            return [command, options]
          }
          if (_command.action === false) {
            this.app.log.debug(`${m} to continue without data`)
            return [command, options]
          }

          // Validate after the step
          return this.validate(validators, _command, options)
            .catch(err => {
              this.app.log.error(
                `After Handler ${m} failed validation for ${command.command_type}`,
                err
              )
              return Promise.reject(err)
            })
        })
        .then(([_command, _options]) => {

          command.chain_after.push(m)

          // const handler = afterHandlers.get(m)

          if (handler && handler.merge && handler.merge !== false) {
            command.mergeData(m, handler, _command)
          }

          if (handler && handler.push && handler.push !== false) {
            command.pushOn(m, handler, _command)
          }

          if (handler && handler.zip && handler.zip !== false) {
            command.zip(m, handler, _command)
          }

          if (handler && handler.include && handler.include !== false) {
            command.includeOn(m, handler, _command)
            this.app.log.debug(`${this.name}: After Handler ${m} included data on ${handler.include}`)
          }

          if (handler.data) {
            command.handleData(m, handler, _command)
          }
          if (handler.metadata) {
            command.handleMetadata(m, handler, _command)
          }

          command.complete = true

          const hookend = process.hrtime(hookstart)
          this.app.log.debug(
            `${this.name}.${m}: ${_command.command_type} After Hook Execution time (hr): ${hookend[0]}s ${hookend[1] / 1000000}ms`
          )

          return [command, options]
        })
        .catch(err => {
          command.breakException = breakException = err
          // TODO perhaps retry up to a limit?
          this.app.log.error(`${p.name} threw an error - fatal`, err)
          return Promise.reject(err)
        })
    })
      .then(results => [command, options])
  }

  /**
   * Notify BroadcastChannels that event is fully committed
   * TODO remove ephemeral subscriptions https://github.com/fabrix-app/spool-broadcast/issues/3
   * @param event
   * @param options
   */
  notify(event: BroadcastEvent, options) {
    //

    const subscribers = this.getSubscribers(event.event_type)
    const brokers = this.getBrokers(event.event_type)

    // const eternal = this.getEternalSubscribers(event.event_type)
    // const eternalBrokers = this.getEternalBrokers(event.event_type)
    //
    // const ephemeral = this.getEphemeralSubscribers(event.event_type)
    // const ephemeralBrokers = this.getEphemeralBrokers(event.event_type)


    // if (!ephemeral || !ephemeralBrokers || !eternal || !eternalBrokers) {
    //   const err = new this.app.errors.GenericError(
    //     'E_FAILED_DEPENDENCY',
    //     'Eternal Subscribers/Brokers or Ephemeral Subscribers/Brokers are not defined'
    //   )
    //   return Promise.reject(err)
    // }

    if (!subscribers || !brokers) {
      const err = new this.app.errors.GenericError(
        'E_FAILED_DEPENDENCY',
        'Eternal Subscribers/Brokers or Ephemeral Subscribers/Brokers are not defined'
      )
      return Promise.reject(err)
    }

    // Check that there is a transaction chain, and that we are listening to the root one
    const topLevelTransaction = this.unnestTransaction(options)

    const elog = []
    subscribers.forEach((v, k) => elog.push(k))

    if (
      topLevelTransaction
      && !topLevelTransaction.finished
    ) {
      // Setup Transaction afterCommit Hook from the original options
      topLevelTransaction.afterCommit((transaction) => {
        this.app.log.debug(
          `Broadcaster ${this.name}`,
          `${subscribers.size} subscribers will be notified for event ${event.event_type}`,
          `after transaction commit ${topLevelTransaction.id}`,
          `: ${elog.map(k => k).join(' -> ')}`
        )
        // console.log('BRK TEST NOTIFY', subscribers, brokers, eternal, eternalBrokers, ephemeral, ephemeralBrokers)
        return this.notifySubscribers(subscribers, brokers, event, options)
      })

      return [event, options]
    }
    else {
      // console.log('BRK TEST NOTIFY', subscribers, brokers, eternal, eternalBrokers, ephemeral, ephemeralBrokers)
      return this.notifySubscribers(subscribers, brokers, event, options)
    }
  }

  /**
   * Runs the methods subscribed to this event_type
   * @param subscribers
   * @param brokers
   * @param event
   * @param options
   */
  notifySubscribers(subscribers, brokers, event, options) {
    let breakException
    // Setup Subscribers in priority order
    const subscribersAsc = new Map([...subscribers.entries()].sort((a, b) => {
      return brokers.get(a[0]).priority - brokers.get(b[0]).priority
    }))

    // Log the order
    const slog = []
    subscribersAsc.forEach((v, k) => slog.push(k))

    this.app.log.debug(
      `Broadcaster ${this.name} notifying`,
      `${subscribersAsc.size} for event ${event.event_type}`,
      `: ${slog.map(k => k).join(' -> ')}`
    )

    // List the promises to execute
    const promises = Array.from(subscribersAsc.entries())

    return this.process(brokers, promises, ([m, p], k) => {

      // If this series is broken, no need to continue
      if (breakException) {
        return Promise.reject(breakException)
      }

      const broker = brokers.get(m)

      // Receiver Test
      if (broker && broker.expects_input) {
        if (
          typeof broker.expects_input === 'string'
          && broker.expects_input !== '*'
          && event.getDataValue('object') !== broker.expects_input
        ) {
          throw new this.app.errors.GenericError(
            'E_PRECONDITION_FAILED',
            `${m} subscriber expects_input ${broker.expects_input}
            but got ${event.getDataValue('object')} for ${event.event_type}`
          )
        }
        else if (
          Array.isArray(broker.expects_input)
          && !broker.expects_input.includes(event.getDataValue('object') || '*')
        ) {
          throw new this.app.errors.GenericError(
            'E_PRECONDITION_FAILED',
            `${m} subscriber expects_input one of ${broker.expects_input.join(', ')}
            but got ${event.getDataValue('object')} for ${event.event_type}`
          )
        }
      }
      else {
        this.app.log.debug(`${event.event_type} broker ${m} subscriber assuming it expects_input ${event.getDataValue('object')}`)
      }

      // Check and promise events
      if (!p || typeof p !== 'function') {
        this.app.log.warn(`${m} attempted to call a non function ${p}! - returning`)
        return [event, options]
      }

      // Get the time for the start of the hook
      const notifystart = process.hrtime()

      return p({
        event,
        options,
        lifespan: broker.lifespan,
        broker: broker
      })
        .run()
        .then((_p) => {
          return _p.publish()
        })
        .then(() => {
          const notifyend = process.hrtime(notifystart)
          this.app.log.debug(
            `${this.name}.${m}: ${event.event_type} Execution time (hr): ${notifyend[0]}s ${notifyend[1] / 1000000}ms`
          )
          if (broker.lifespan === 'ephemeral') {
            this.app.log.debug('removing ephemeral subscriber', m, 'for event', event.event_type)
            this.removeSubscriber({ event_type: event.event_type, lifespan: 'ephemeral', name: m })
          }
          return [event, options]
        })
        .catch(err => {
          breakException = err
          // TODO perhaps retry up to a limit?
          this.app.log.error(`${p.name} threw an error - fatal`, err)
          return Promise.reject(err)
        })
    })
      .then(results => [event, options])
  }


  /**
   * Save event and Broadcast the event to the projectors
   * @param event
   * @param options
   */
  broadcast(event: BroadcastEvent, options) {

    // Event should be an actual BroadcastEvent
    if (!(event instanceof this.app.models.BroadcastEvent.instance)) {
      throw new this.app.errors.GenericError(
        'E_FAILED_DEPENDENCY',
        'event is not an instance of BroadcastEvent'
      )
    }
    // Should by default have the ability to serialize its own data
    if (typeof event.object.toBinaryData === 'undefined') {
      throw new this.app.errors.GenericError(
        'E_FAILED_DEPENDENCY',
        'Data object does not have a toBinaryData function'
      )
    }
    // Should by default have the ability to serialize its own metadata
    if (typeof event.object.toBinaryMetadata === 'undefined') {
      throw new this.app.errors.GenericError(
        'E_FAILED_DEPENDENCY',
        'Data object does not have a toBinaryMetadata function'
      )
    }

    // Send to the projectors
    return this.project(event, options)
      .then(([_event, _options]) => {
        return event.save(options)
          .then(() => {
            return [event, options]
          })
      })
      // TODO listen to the commit
      .then(([_event, _options]) => this.notify(_event, _options))
      .catch(err => {
        this.app.log.error(`Failure while running ${event.event_type}`, err)
        // TODO reverse SAGA
        return [event, options]
      })
    // return event.save(options)
    //   .then(() => {
    //     // Send to the projectors
    //     return this.project(event, options)
    //       .catch(err => {
    //         this.app.log.error(`Failure while projecting ${event.event_type}`, err)
    //         // TODO reverse SAGA SBW
    //         return [event, options]
    //       })
    //   })
      .then(([_e, _o]) => {
        // The processors/projectors should have returned the event
        if (!(_e instanceof this.app.models.BroadcastEvent.instance)) {
          throw new Error(`${event.event_type} Projection returned an instance different than BroadcastEvent! - fatal`)
        }
        if (_e.event_uuid !== event.event_uuid) {
          throw new Error(`${event.event_type} Projection returned a different event uuid than origin - fatal`)
        }
        if (_e.event_type !== event.event_type) {
          throw new Error(`${event.event_type} Projection returned a different event type than origin - fatal`)
        }
        // if (_e.changed()) {
        //   console.log('BRK changes!', _e.changed())
        //   return event.save(options)
        //     .then(() => {
        //       return [event, options]
        //     })
        // }
        // return the event tuple
        return [event, options]
      })
      .catch(err => {
        this.app.log.error(err)
        // return Promise.reject(err)
        return Promise.reject(new this.app.errors.GenericError(
          'E_UNPROCESSABLE_ENTITY',
          `BroadcastEvent: ${event.event_type} was unable to save - fatal`
        ))
      })
  }

  /**
   * Broadcast multiple non linear events
   * TODO either test or deprecate
   * @param events
   * @param options
   */
  bulkBroadcast(events: BroadcastEvent[] = [], options) {
    return this.process(new Map(), events, e => this.broadcast(e, options))
  }

  /**
   * Given an options argument with a transaction tree, find the top most level transaction
   * @param options
   */
  unnestTransaction(options) {
    if (options && options.parent && options.parent.transaction) {
      if (options.transaction) {
        this.app.log.debug('transaction', options.transaction.id, 'will await', options.parent.transaction.id)
      }
      return this.unnestTransaction(options.parent)
    }
    else if (options.transaction) {
      this.app.log.debug('awaiting transaction', options.transaction.id)
      return options.transaction
    }
    else {
      return null
    }
  }

  unnestTraceChildren(children, parent?) {
    let trace = new Map()
    children.forEach((v, k, map) => {
      trace.set(`${parent ? parent + '->' : ''}${k}`, v)
      if (v && v.children) {
        const childStart = this.unnestTraceChildren(v.children, k)
        trace = new Map([...trace, ...childStart])
      }
    })
    return trace
  }
  /**
   * Given an options argument with a trace tree, find the top most level trace
   * @param options
   */
  unnestTrace(options) {
    let trace = new Map([...(options && options.trace ? options.trace : new Map())])

    trace = new Map([...this.unnestTraceChildren(trace)])

    if (options && options.parent && options.parent.trace) {
      const parent = this.unnestTrace(options.parent)
      trace = new Map([...parent, ...trace])
    }

    // trace.forEach((v: {[key: string]: any}, k, map) => {
    //   if (v.children) {
    //     console.log('BRK trace children', v.children)
    //     trace = new Map([...trace, ...this.unnestTrace({ trace: v.children })])
    //     // v.children.forEach((c, i) => {
    //     //
    //     // })
    //   }
    // })

    // if (options && options.children) {
    //   options.children.forEach((c, i) => {
    //     if (c && c.trace) {
    //       trace = new Map([...trace, ...this.unnestTrace({trace: c.trace})])
    //       // const par = c.trace.keys().next().value
    //       // const parent = options.trace.get(par)
    //       // if (parent) {
    //       //   const children = parent.children ? new Map([...parent.children, ...c.trace]) : new Map([...c.trace])
    //       //   parent.children = children
    //       //   options.trace.set(par, parent)
    //       // }
    //       // else {
    //       //   this.app.log.warn('BRK could not unnest trace for', par, parent, c.trace)
    //       // }
    //     }
    //   })
    // }

    return trace
  }

  flattenTraceChildren(children) {
    let trace = new Set()
    children.forEach((v, k, map) => {
      trace.add(k)
      if (v && v.children) {
        const childStart = this.flattenTraceChildren(v.children)
        trace = new Set([...trace, ...childStart])
      }
    })
    return trace
  }

  flattenTrace(options) {
    const start = this.unnestTrace(options)

    return this.flattenTraceChildren(start)
  }
  /**
   * BroadcastProject the event that was persisted
   * @param event
   * @param options
   */
  project(event: BroadcastEvent, options) {

    const strong = this.getStrongEvents(event.event_type)
    const strongManagers = this.getStrongManagers(event.event_type)
    const eventual = this.getEventualEvents(event.event_type)
    const eventualManagers = this.getEventualManagers(event.event_type)

    if (!strong || !strongManagers || !eventual || !eventualManagers) {
      const err = new this.app.errors.GenericError(
        'E_FAILED_DEPENDENCY',
        'Strong Events/Managers or Eventual Events/Manager are not defined'
      )
      return Promise.reject(err)
    }

    // Throw a warning if this is being processed without a transaction
    if (!options.transaction) {
      this.app.log.warn(`${this.name} broadcasting ${event.event_type} without a transaction!` )
    }

    // options.parent = options.parent ? options.parent : { trace: new Map() }
    options.trace = options.trace ? options.trace : new Map()

    // Publish the strong events
    return this.projectStrong(strong, strongManagers, event, options)
      .then(([_event, _options]) => {

        const elog = []
        eventual.forEach((v, k) => elog.push(k))

        // Set the tracer for eventual
        Array.from(eventualManagers.keys()).forEach(e => {
          // console.log('BRK publishing pattern 0', e)
          const manager = eventualManagers.get(e)
          const trace = options.trace.set(`${manager.pattern_raw}::${manager.type}::${e}`, manager)

          event.chain_events.push(e)
        })

        // Check that there is a transaction chain, and that we are listening to the root one
        const topLevelTransaction = this.unnestTransaction(options)
        // If there is a root transaction, add the eventual events to when it's committed
        if (
          topLevelTransaction
          && !topLevelTransaction.finished
          && eventual.size > 0
        ) {

          // Setup Transaction afterCommit Hook from the original options
          topLevelTransaction.afterCommit((transaction) => {
            this.app.log.debug(
              `Broadcaster ${this.name} broadcasting`,
              `${eventual.size} eventual for event ${_event.event_type}`,
              `after transaction commit ${topLevelTransaction.id}`,
              `: ${elog.map(k => k).join(' -> ')}`
            )
            // if (options.parent && options.parent.transaction) {
            //   console.log('brk after committed parent', options.parent.transaction, options.transaction)
            // }

            // Publish the eventual events
            return this.publishEventual(eventual, eventualManagers, _event, _options)
              .then(results => [_event, _options])
              .catch(err => {
                this.app.log.error(`Unhandled: ${event.event_type} Broadcast.project.publishEventual after commit`, err)
                throw new Error(err)
              })
          })

          // Return the event
          return [_event, _options]
        }
        // Otherwise, if there isn't a transaction, just run it now
        else if (eventual.size > 0) {
          this.app.log.debug(
            `Broadcaster ${this.name} broadcasting on independent transaction`,
            `${ eventual.size } eventual for event ${_event.event_type}`,
            `: ${elog.map(k => k).join(' -> ')}`
          )
          // Publish the eventual events
          return this.publishEventual(eventual, eventualManagers, _event, _options)
            .then(results => [_event, _options])
            .catch(err => {
              // TODO better define this error
              this.app.log.error('Broadcast.project.publishEventual independent transaction', err)
              throw new this.app.errors.GenericError(err)
            })
        }
        // No eventual listeners, just return
        else {
          return [_event, _options]
        }
      })
      // .then(([_event, _options]) => {
      //
      //   // Return the original event
      //   return [_event, _options]
      // })
  }

  /**
   * BroadcastProject the Strong Events
   * @param strongEvents
   * @param strongManagers
   * @param event
   * @param options
   */
  projectStrong(strongEvents, strongManagers, event, options) {
    let breakException
    // Setup Strong Events in priority order
    const strongEventsAsc = new Map([...strongEvents.entries()].sort((a, b) => {
      return strongManagers.get(a[0]).priority - strongManagers.get(b[0]).priority
    }))
    // Log the order
    const slog = []

    strongEventsAsc.forEach((v, k) => slog.push(k))

    this.app.log.debug(
      `Broadcaster ${this.name} broadcasting`,
      `${strongEventsAsc.size} strong for event ${event.event_type}`,
      `: ${slog.map(k => k).join(' -> ')}`
    )

    const promises = Array.from(strongEventsAsc.entries())

    return this.process(strongManagers, promises, ([m, p]) => {
      // If this series is broken, no need to continue
      if (breakException) {
        return Promise.reject(breakException)
      }

      const manager = strongManagers.get(m)

      const trace = options.trace.set(`${manager.pattern_raw}::${manager.type}::${m}`, manager)

      // Receiver Test
      if (manager && manager.expects_input) {
        if (
          typeof manager.expects_input === 'string'
          && manager.expects_input !== '*'
          && String(event.getDataValue('object')) !== manager.expects_input
        ) {
          throw new this.app.errors.GenericError(
            'E_PRECONDITION_FAILED',
            `${m} ${manager.type} expects_input ${manager.expects_input}
            but got ${event.getDataValue('object')} for ${event.event_type}`
          )
        }
        else if (
          Array.isArray(manager.expects_input)
          && !manager.expects_input.includes(event.getDataValue('object') || '*')
        ) {
          throw new this.app.errors.GenericError(
            'E_PRECONDITION_FAILED',
            `${m} ${manager.type} expects one of ${manager.expects_input.join(', ')} as input,
            but got ${event.getDataValue('object')} for ${event.event_type}`
          )
        }
      }
      else {
        this.app.log.debug(`${event.event_type} manager ${m} ${manager.type}
        assuming it expects_input ${event.getDataValue('object')}`)
      }

      // Check and promise events
      if (!p || typeof p !== 'function') {
        this.app.log.warn(`${this.name} ${m} attempted to call a non function ${p}! Unhandled - returning without running`)
        return [event, options]
      }

      return this.run(event, options, p, m, manager, breakException, trace)
    })
      .then(results => {
        return [event, options]
      })
  }

  /**
   * TODO, getting messy here, need to clean this up a lot
   * Run the Process or Projection
   * @param event
   * @param options
   * @param p
   * @param m
   * @param manager
   * @param breakException
   * @param trace
   */
  run(event, options, p, m, manager, breakException, trace) {

    // Get the time for the start of the hook
    const projectstart = process.hrtime()

    let projectend = process.hrtime(projectstart)
    let t = `${manager ? manager.type : 'unknown'}`

    // Run the processor/projector
    return p({
      event,
      options,
      consistency: manager.consistency || 'strong',
      message: null,
      manager: manager
    })
      .run()
      .catch(err => {
        this.app.log.error(`${p.name}`, err)
        if (manager.consistency === 'eventual') {
          return Promise.reject(err)
        }
        else {
          return [{ action: 'retry' }, options]
        }
      })
      .then(([_event, _options]) => {
        // Marks the acknowledged state of the message
        p.isAcknowledged = true

        // This Block makes sure that the response is manageable
        // make sure that an event was returned
        if (!_event) {
          throw new this.app.errors.GenericError(
            'E_FAILED_DEPENDENCY',
            `${p.name} Projection returned no event for ${m}! - fatal`
          )
        }
        else if (!isArray(_event)) {
          // Make sure an event was returned
          if (!_event) {
            throw new this.app.errors.GenericError(
              'E_NOT_ACCEPTABLE',
              `${p.name} Projection returned invalid response for ${m}! - fatal`
            )
          }
          // Make sure that it was not a command returned
          if (_event instanceof BroadcastCommand) {
            throw new this.app.errors.GenericError(
              'E_NOT_ACCEPTABLE',
              `${p.name} Projection returned a Command instead of an Event for ${m}! - fatal`
            )
          }

          // See if the
          if (_event.action && _event.action === 'retry') {
            this.app.log.error(`${this.name} ${p.name} BRK unhandled retry action for ${m}`)
            projectend = process.hrtime(projectstart)
            this.app.log.debug(
              `${this.name}.${m}: ${_event.event_type} ${t} Execution time (hr): ${projectend[0]}s ${projectend[1] / 1000000}ms`
            )
            return [event, options]
          }

          if (_event.action === false) {
            this.app.log.debug(`${this.name} ${m} to continue without data`)
            projectend = process.hrtime(projectstart)
            this.app.log.debug(
              `${this.name}.${m}: ${_event.event_type} ${t} Execution time (hr): ${projectend[0]}s ${projectend[1] / 1000000}ms`
            )
            return [event, options]
          }
        }
        //
        else {
          _event.forEach(_e => {
            if (!_e) {
              throw new this.app.errors.GenericError(
                'E_UNPROCESSABLE_ENTITY',
                `${p.name} Projection returned invalid response for ${m}! - fatal`
              )
            }
            if (_e[0] instanceof BroadcastCommand) {
              throw new this.app.errors.GenericError(
                'E_NOT_ACCEPTABLE',
                `${p.name} Projection returned a Command instead of an Event for ${m}! - fatal`)
            }
          })
          // Check that all the returned events were successful
          if (_event.every(_e => _e[0].action && _e[0].action === 'retry')) {

            this.app.log.debug.error(`${this.name} ${p.name} BRK unhandled retry action for ${m} in list of events`)
            projectend = process.hrtime(projectstart)
            this.app.log.debug(
              `${this.name}.${m}: ${_event.event_type} ${t} Execution time (hr): ${projectend[0]}s ${projectend[1] / 1000000}ms`
            )

            return [event, options]
          }
          else {
            // TODO handle some of the events that failed in the array of events returned
          }

          // Check that all the returned events require no action
          if (_event.every(_e => _e[0].action && _e[0].action === false)) {
            this.app.log.debug(`${m} to continue without data in list of events`)
            projectend = process.hrtime(projectstart)
            this.app.log.debug(
              `${this.name}.${m}: ${_event.event_type} ${t} Execution time (hr): ${projectend[0]}s ${projectend[1] / 1000000}ms`
            )
            return [event, options]
          }
          else {
            // TODO handle some of the events that failed in the array of events returned
          }
        }

        // Adds this to the chain if it makes it to here
        if (m) {
          event.chain_events.push(m)
        }

        this.app.log.silly(this.name, m, 'current chain_events', event.chain_events)

        // TODO deprecate
        if (manager && manager.merge && manager.merge !== false) {
          event.mergeData(m, manager, _event)
        }
        if (manager && manager.push && manager.push !== false) {
          event.pushOn(m, manager, _event)
        }
        if (manager && manager.zip && manager.zip !== false) {
          event.zip(m, manager, _event)
        }
        if (manager && manager.include && manager.include !== false) {
          event.includeOn(m, manager, _event)
        }

        // TODO make default
        if (manager.data) {
          event.handleData(m, manager, _event)
        }
        if (manager.metadata) {
          event.handleMetadata(m, manager, _event)
        }

        options.trace = options.trace || new Map()
        options.children = options.children || []

        // Processors have children
        if (t === 'processor') {

          // Update the trace
          // TODO figure out which one of these methods to use
          const parent = options.trace.get(`${manager.pattern_raw}::${manager.type}::${m}`, manager)
          parent.children = new Map([...(parent.children || new Map()), ...(_options.trace || new Map())])
          options.trace.set(`${manager.pattern_raw}::${manager.type}::${m}`, parent)

          // trace.children = new Map([...(trace.children || new Map()), ...(_options.trace || new Map())])

          options.children.push({
            transaction: _options.transaction,
            useMaster: _options.useMaster,
            trace: _options.trace ? _options.trace : new Map()
          })
        }

        projectend = process.hrtime(projectstart)
        this.app.log.debug(
          `${this.name}.${m}: ${_event.event_type} ${t} Execution time (hr): ${projectend[0]}s ${projectend[1] / 1000000}ms`
        )

        return [event, options]
      })
      // .then(([_event, _options]) => {
      //   return p.finalize()
      //     .then(() => {
      //       // utils.clearHandler(client.active_broadcasts.get(this.name), p)
      //       return [event, options]
      //     })
      // })
      .catch(err => {
        breakException = err
        // TODO perhaps retry up to a limit?
        this.app.log.error(`${this.name} ${p.name} threw an error - fatal`, err)
        return Promise.reject(err)
      })
  }

  /**
   * BroadcastProject Eventual
   * @param eventualEvents
   * @param eventualManagers
   * @param event
   * @param options
   */
  publishEventual(eventualEvents, eventualManagers, event, options) {

    // eventualEvents.forEach(e => {
    //   if (e) {
    //     event.chain_events.push(e)
    //   }
    // })

    // Set the tracer for eventual
    // Array.from(eventualManagers.keys()).forEach(e => {
    //   // console.log('BRK publishing pattern 0', e)
    //   const manager = eventualManagers.get(e)
    //   const trace = options.trace.set(`${manager.pattern_raw}::${manager.type}::${e}`, manager)
    // })

    const patterns = uniqBy(
      Array.from(eventualManagers.values())
        .map((v: {[key: string]: any}) => {
          return v
        })
        .filter(v => v.pattern_raw)
    , 'pattern_raw')

    patterns.forEach(manager => {
      this.app.log.debug('Broadcaster', this.name, 'publishing pattern', manager.pattern_raw)
    })

    return this.app.broadcastSeries(patterns, (manager) => {
      if (manager.type === 'processor') {
        this.app.log.warn(
          `${event.event_type} is publishing an "eventual" processor!`,
          `Unless this processor has a projector listenting to the same event, and a later priority it will lock the que!`,
          `see https://github.com/fabrix-app/spool-broadcast/issues/8 to track this issue`,
          manager
        )
      }

      // Publish the eventual events
      return this.app.broadcaster.publish({
        broadcaster: this,
        event_type: manager.pattern_raw,
        event: event,
        options: options,
        consistency: 'eventual',
        manager: manager
      })
        .catch(err => {
          this.app.log.error(`Broadcast ${this.name} Publishing Error`, err)
          // TODO retry regression
          return [event, options]
        })
    })
      .then((res = []) => {
        this.app.log.silly(`Broadcast ${this.name} Published Results:`)
        res.forEach(([e, o]) => {
          this.app.log.silly(e)
          this.app.log.silly(o)
        })
        // TODO retry regression
        return [event, options]
      })
  }

  runEventual(client, eventualEvents, eventualManagers, message) {
    // Get the time for the start of the hook
    const eventualstart = process.hrtime()

    // Setup eventual Events in priority order
    const eventualEventsAsc = new Map([...eventualEvents.entries()].sort((a, b) => {
      return eventualManagers.get(a[0]).priority - eventualManagers.get(b[0]).priority
    }))
    // Log the order
    const slog = []

    // List the promises to execute
    const events = Array.from(eventualEventsAsc.entries())

    let breakException

    eventualEventsAsc.forEach((v, k) => slog.push(k))

    this.app.log.debug(
      `Broadcaster ${this.name} running`,
      `${eventualEventsAsc.size} eventual for event ${message.type}`,
      `: ${slog.map(k => k).join(' -> ')}`
    )

    // This keeps namespace clean for eventual events and they can use their own transaction
    return this.app.models.BroadcastEvent.sequelize.transaction({
      isolationLevel: this.app.spools.sequelize._datastore.Transaction.ISOLATION_LEVELS.READ_UNCOMMITTED,
      deferrable: this.app.spools.sequelize._datastore.Deferrable.SET_DEFERRED
    }, t => {

      const options = {
        transaction: t,
        trace: new Map()
      }

      return this.process(eventualManagers, events, ([key, projector]) => {

        if (breakException) {
          return Promise.reject(breakException)
        }

        const manager = eventualManagers.get(key)

        if (manager.type === 'processor') {
          return this.runEventualProcessor(client, projector, key, manager, message, options, breakException)
        }
        else {
          return this.runEventualProjector(client, projector, key, manager, message, options, breakException)
        }
      })

    })
      .then(res => {
        message.ack()

        const eventualend = process.hrtime(eventualstart)

        this.app.log.debug(
          `${message.type} Eventual Execution time (hr): ${eventualend[0]}s ${eventualend[1] / 1000000}ms`
        )

        return res
      })
      .catch(err => {
        this.app.log.error(`Utils.registerEventualListeners ${message.type} err - fatal`, err)
        // Try and nack the message TODO, should be rejected?
        message.nack()
        return Promise.reject(err)
      })
  }

  /**
   * Run an Eventual Processor
   * @param client
   * @param project
   * @param key
   * @param manager
   * @param message
   * @param options
   * @param breakException
   */
  runEventualProcessor (client, project, key, manager, message, options, breakException) {
    if (message.fields.redelivered) {
      this.app.log.warn('Rabbit Message', message.type, 'was redelivered!')
    }

    const event = this.app.models.BroadcastEvent.stage(message.body, { isNewRecord: false })


    // // so we know who should handle an interrupt call
    // client.active_broadcasts
    //   .get(this.name)
    //   .push(p)

    // Set the trace
    const trace = options.trace.set(`${manager.pattern_raw}::${manager.type}::${key}`, manager)

    return this.run(event, options, project, key, manager, breakException, trace)
      .then(([_event, _options]) => {
        project.isAcknowledged = true
        return [_event, _options]
      })
  }
  /**
   * Run an Eventual Projector
   * @param client
   * @param project
   * @param key
   * @param manager
   * @param message
   * @param options
   * @param breakException
   */
  runEventualProjector (client, project, key, manager, message, options, breakException) {

    let p

    if (message.fields.redelivered) {
      this.app.log.warn('Rabbit Message', message.type, 'was redelivered!')
    }

    const event = this.app.models.BroadcastEvent.stage(message.body, { isNewRecord: false })

    // Set the trace
    const trace = options.trace.set(`${manager.pattern_raw}::${manager.type}::${key}`, manager)

    return Promise.resolve()
      .then(() => {

          try {

            p = project({
              event,
              options,
              consistency: 'eventual',
              message: message,
              manager: manager
            })

            this.app.log.debug(event.event_type, 'broadcasted from', this.name, '->', project.name, '->', p.name)
          }
          catch (err) {
            this.app.log.error('Broadcaster Utils.runProjector err - fatal', err)
            return Promise.reject(err)
          }

          if (!client.active_broadcasts.has(this.name)) {
            const err = new Error(
              `Broadcaster Utils.runProjector err Client should have active_broadcast of ${this.name} - fatal`
            )
            this.app.log.error('Broadcaster Utils.runProjector err - fatal', err)
            return Promise.reject(err)
          }

          if (typeof p.run !== 'function') {
            const err = new Error(
              `${this.name} ${p.name} should have a run function!`
            )
            this.app.log.error('Broadcaster Utils.runProjector err - fatal', err)
            return Promise.reject(err)
          }

          // if (typeof p.ack !== 'function') {
          //   const err = new this.app.errors.GenericError(
          //     'E_BAD_REQUEST',
          //     `${this.name} ${p.name} should have an ack function!`
          //   )
          //   this.app.log.error('Broadcaster Utils.runProjector err - fatal', err)
          //   return Promise.reject(err)
          // }

          // so we know who should handle an interrupt call
          client.active_broadcasts
            .get(this.name)
            .push(p)

          return Promise.resolve()
            .then(() => {
              return p.run()
              .then(([_event, _options]) => {
                p.isAcknowledged = true
                return [_event, _options]
              })
              .catch(err => {
                this.app.log.error(`${this.name} Error in projector ${p.name}.run() - fatal`, err)
                return Promise.reject(err)
              })
            })
            .then(([_event, _options]) => {
              // This will get cleared no matter what
              return p.finalize()
                .then(() => {
                  utils.clearHandler(client.active_broadcasts.get(this.name), p)
                  return [_event, _options]
                })
                .catch(() => {
                  utils.clearHandler(client.active_broadcasts.get(this.name), p)
                  return [_event, _options]
                })
            })
            .catch((err) => {
              this.app.log.error(`Unhandled Error for project ${p.name} - fatal`, err)
              utils.clearHandler(client.active_broadcasts.get(this.name), p)
              return Promise.reject(err)
            })
        })
      .catch((err) => {
        breakException = err
        // TODO perhaps retry up to a limit?
        this.app.log.error(`${this.name} ${p.name} threw an error - fatal`, err)
        // TODO
        return err
        // return Promise.reject(err)
      })
  }


  /**
   * Return map of channels
   */
  channels() {
    return this._channels
  }

  /**
   * Return map of subscribers
   */
  subscribers() {
    return this._subscribers
  }

  /**
   * Return map of brokers
   */
  brokers() {
    return this._brokers
  }

  /**
   * Add a Channel
   * @param channel
   */
  addChannel (channel: BroadcastChannel) {

    if (!(channel instanceof BroadcastChannel)) {
      throw new Error(`${channel} is not an instance of Channel`)
    }

    this._channels.set(channel.name, channel)

    const config = this.app.config.get(`broadcast.channels.${channel.name}.broadcasters.${this.name}`)
    const subscriberTypes = Object.keys(config || {})


    subscriberTypes.forEach(subscriberType => {
      const methods = Object.keys(config[subscriberType])
      const subscribers = config[subscriberType]

      methods.forEach(m => {
        if (
          typeof channel[m] !== 'function'
          && get(this.app.entries, m) === 'undefined'
        ) {
          throw new this.app.errors.GenericError(
            'E_FAILED_DEPENDENCY',
            `Neither app.channels.${channel.name}.${m} or app.entries.${m} are a function, check config/broadcast channels`)
        }

        // const { error } = joi.validate(subscribers[m].config, subscriberConfig)
        const { error } = subscriberConfig.validate(subscribers[m].config)

        if (error) {
          throw new Error(`${channel.name} config is invalid`)
        }

        this.app.log.silly(`Adding channel ${channel.name}.${m} to broadcaster ${this.name} for subscriber ${subscriberType}`)

        channel.subscribers.set(subscriberType, m)

        this.addSubscriber({
          event_type: subscriberType,
          type: 'channel',
          name: `${m}`,
          method: typeof channel[m] === 'function' ? channel[m] : get(this.app.entries, m),
          config: subscribers[m].config
        })
      })
    })

    return this
  }


  /**
   * Add Subscriber Subscriber
   * @param event_type
   * @param type
   * @param name
   * @param method
   * @param config
   */
  addSubscriber({event_type, type, name, method, config = {}}): Broadcast {

    const lifespan = 'eternal'
    const { keys, pattern } = regexdot(event_type)
    const key = event_type // pattern // .toString()

    // Add default configs
    config = {
      type: type,
      lifespan: lifespan,
      priority: 255,
      retry_on_fail: false,
      retry_on_timeout: null,
      retry_max: 0,
      retry_wait: null,
      retry_attempts: 0,
      processing: 'parallel',
      params: keys,
      pattern: pattern,
      pattern_raw: event_type,
      ...config
    }

    if (this._subscribers.has(key)) {
      const subscriber = this._subscribers.get(key)
      const broker = this._brokers.get(key)

      if (subscriber[lifespan]) {
        subscriber[lifespan].set(name, method)
        broker[lifespan].set(name, config)
      }
      else {
        subscriber[lifespan] = new Map([[name, method]])
        broker[lifespan] = new Map([[name, config]])
      }
    }
    else {
      this._subscribers.set(key, {
        [lifespan]: new Map([[name, method]])
      })
      this._brokers.set(key, {
        [lifespan]: new Map([[name, config]])
      })
    }
    return this
  }


  /**
   * Has Subscriber type
   * @param event_type
   */
  hasSubscriber({event_type}) {
    // const { keys, pattern } = regexdot(event_type)
    // return this._subscribers.has(pattern)

    this._subscribers.forEach( (subscribers, _k: any) => {
      // const key = _k // new RegExp(_k)
      // const match = key.test('.' + event_type)
      const { pattern, keys } = regexdot(_k)
      const match = pattern.test('.' + event_type)
      if (match) {
        return match
      }
    })
  }
  hasBroker({event_type}) {
    // const { keys, pattern } = regexdot(event_type)
    // return this._brokers.has(pattern)

    this._brokers.forEach( (brokers, _k: any) => {
      // const key = _k // new RegExp(_k)
      // const match = key.test('.' + event_type)
      const { pattern, keys } = regexdot(_k)
      const match = pattern.test('.' + event_type)
      if (match) {
        return match
      }
    })
  }


  /**
   * Get subscribers by type with any lifespan
   * @param event_type
   */
  getSubscribers(event_type): Map<string, any> {
    let types = []

    this._subscribers.forEach( (subscribers, _k: any) => {
      // const key = _k // new RegExp(_k)
      // const match = key.test('.' + event_type)
      const { pattern } = regexdot(_k)
      const match = pattern.test('.' + event_type)

      if (match) {
        const keys = Object.keys(subscribers || {})
        keys.forEach(k => {
          if (subscribers[k]) {
            types = [...types, ...subscribers[k]]
          }
        })
      }
    })

    return new Map(types)
  }

  /**
   * Get subscribers by type with any lifespan
   * @param event_type
   */
  getBrokers(event_type): Map<string, any> {
    let _brokers = []

    this._brokers.forEach( (brokers, _k: any) => {
      // const key = _k // new RegExp(_k)
      // const match = key.test('.' + event_type)
      const { pattern } = regexdot(_k)
      const match = pattern.test('.' + event_type)

      if (match) {
        const keys = Object.keys(brokers || {})
        keys.forEach(k => {
          if (brokers[k]) {
            _brokers = [..._brokers, ...brokers[k]]
          }
        })
      }
    })
    return new Map(_brokers)
  }

  /**
   * Get subscribers by type with eternal lifespan
   * @param event_type
   */
  getEternalSubscribers(event_type): Map<string, any> {
    let _subscribers = []

    this._subscribers.forEach( (subscribers, _k: any) => {
      // const key = _k // new RegExp(_k)
      // const match = key.test('.' + event_type)

      const { pattern, keys } = regexdot(_k)
      const match = pattern.test('.' + event_type)

      if (match && subscribers['eternal']) {
        _subscribers = [..._subscribers, ...subscribers['eternal']]
      }
    })
    return new Map(_subscribers)
  }

  /**
   * Get subscribers by type with eternal lifespan
   * @param event_type
   */
  getEternalBrokers(event_type): Map<string, any> {
    let _brokers = []

    this._brokers.forEach( (brokers, _k: any) => {
      // const key = _k // new RegExp(_k)
      // const match = key.test('.' + event_type)

      const { pattern, keys } = regexdot(_k)
      const match = pattern.test('.' + event_type)

      if (match && brokers['eternal']) {
        _brokers = [..._brokers, ...brokers['eternal']]
      }
    })
    return new Map(_brokers)
  }

  /**
   * Get subscribers by type with ephemeral lifespan
   * @param event_type
   */
  getEphemeralSubscribers(event_type): Map<string, any> {
    let _subscribers = []

    this._subscribers.forEach( (subscribers, _k: any) => {
      // const key = _k // new RegExp(_k)
      // const match = key.test('.' + event_type)

      const { pattern, keys } = regexdot(_k)
      const match = pattern.test('.' + event_type)

      if (match && subscribers['ephemeral']) {
        _subscribers = [..._subscribers, ...subscribers['ephemeral']]
      }
    })
    return new Map(_subscribers)
  }

  /**
   * Get subscribers by type with ephemeral lifespan
   * @param event_type
   */
  getEphemeralBrokers(event_type): Map<string, any> {
    let _brokers = []

    this._brokers.forEach( (brokers, _k: any) => {
      // const key = _k // new RegExp(_k)
      // const match = key.test('.' + event_type)

      const { pattern, keys } = regexdot(_k)
      const match = pattern.test('.' + event_type)

      if (match && brokers['ephemeral']) {
        _brokers = [..._brokers, ...brokers['ephemeral']]
      }
    })
    return new Map(_brokers)
  }

  /**
   * Remove Subscriber Subscriber
   * @param event_type
   * @param lifespan
   * @param name
   */
  removeSubscriber({event_type, lifespan = 'eternal', name}): Broadcast {
    const { keys, pattern } = regexdot(event_type)
    const key = event_type // .toString()

    if (this._subscribers.has(key)) {
      const subscriber = this._subscribers.get(key)
      const broker = this._brokers.get(key)
      if (subscriber[lifespan]) {
        subscriber[lifespan].delete(name)
        broker[lifespan].delete(name)
      }
    }
    return this
  }

  pipelines() {
    return this._pipelines
  }

  pipes() {
    return this._pipes
  }

  runners() {
    return this._runners
  }

  /**
   * Add a Pipeline
   * @param pipeline
   */
  addPipeline (pipeline: BroadcastPipeline) {

    if (!(pipeline instanceof BroadcastPipeline)) {
      throw new Error(`${pipeline} is not an instance of Pipeline`)
    }

    this._pipelines.set(pipeline.name, pipeline)

    const config = this.app.config.get(`broadcast.pipelines.${pipeline.name}.broadcasters.${this.name}`)
    const pipeTypes = Object.keys(config || {})


    pipeTypes.forEach(pipeType => {
      const methods = Object.keys(config[pipeType])
      const pipes = config[pipeType]

      methods.forEach(m => {
        if (
          typeof pipeline[m] !== 'function'
          && get(this.app.entries, m) === 'undefined'
        ) {
          throw new this.app.errors.GenericError(
            'E_FAILED_DEPENDENCY',
            `Neither ${pipeline.name}.${m} or app.entries.${m} are a function, check config/broadcast pipelines`)
        }

        // const { error } = joi.validate(pipes[m].config, pipeConfig)
        const { error } = pipeConfig.validate(pipes[m].config)

        if (error) {
          throw new Error(`${pipeline.name} config is invalid`)
        }

        this.app.log.silly(`Adding pipeline ${pipeline.name}.${m} to broadcaster ${this.name} for pipe ${pipeType}`)
        this.addPipe({
          pipe_type: pipeType,
          name: `${m}`,
          method: typeof pipeline[m] === 'function' ? pipeline[m] : get(this.app.entries, m),
          config: pipes[m]
        })
      })
    })

    return this
  }


  /**
   * Add BroadcastPipe Subscriber
   * @param pipe_type
   * @param type,
   * @param name
   * @param method
   * @param config
   */
  addPipe({pipe_type, type = 'pipeline', name, method, config = {}}): Broadcast {

    const lifecycle = 'always'

    // // Add default configs
    config = {
      type: type,
      retry_on_fail: false,
      retry_on_timeout: null,
      retry_max: 0,
      retry_wait: null,
      retry_attempts: 0,
      fail_on_error: true,
      processing: 'serial',
      ...config
    }

    if (this._pipes.has(pipe_type)) {
      const pipe = this._pipes.get(pipe_type)
      const runner = this._runners.get(pipe_type)

      if (pipe[lifecycle]) {
        pipe[lifecycle].set(name, method)
        runner[lifecycle].set(name, config)
      }
      else {
        pipe[lifecycle] = new Map([[name, method]])
        runner[lifecycle] = new Map([[name, config]])
      }
    }
    else {
      this._pipes.set(pipe_type, {
        [lifecycle]: new Map([[name, method]])
      })
      this._runners.set(pipe_type, {
        [lifecycle]: new Map([[name, config]])
      })
    }
    return this
  }


  /**
   * Has BroadcastPipe type
   * @param pipe_type
   */
  hasPipe({pipe_type}) {
    return this._pipes.has(pipe_type)
  }
  hasRunner({pipe_type}) {
    return this._runners.has(pipe_type)
  }


  /**
   * Add a BroadcastHookIn
   * @param hookIn
   */
  addHookIn (hookIn: BroadcastHookIn) {

    if (!(hookIn instanceof BroadcastHookIn)) {
      throw new this.app.errors.GenericError(
        'E_PRECONDITION_REQUIRED',
        `${hookIn} is not an instance of HookIn`
      )
    }

    this._hooks.set(hookIn.name, hookIn)

    const config = this.app.config.get(`broadcast.hooks.${hookIn.name}.broadcasters.${this.name}`)
    const commandTypes = Object.keys(config || {})

    commandTypes.forEach(commandType => {
      const methods = Object.keys(config[commandType])
      const commands = config[commandType]

      methods.forEach(m => {
        if (typeof hookIn[m] !== 'function') {
          throw new this.app.errors.GenericError(
            'E_FAILED_DEPENDENCY',
            `HookIn ${hookIn.name}.${m} is not a function, check config/broadcast hooks`
          )
        }
        if (!m) {
          throw new Error(`${hookIn.name} method is undefined`)
        }

        // const {error} = joi.validate(commands[m].config, hookConfig)
        const {error} = hookConfig.validate(commands[m].config)

        if (error) {
          throw new Error(`${hookIn.name} config is invalid`)
        }

        hookIn.handlers.set(commandType, m)

        this.app.log.silly(`Adding hookIn ${hookIn.name}.${m} to broadcaster ${this.name} for command ${commandType}`)
        this.addCommand({
          command_type: commandType,
          type: 'hook',
          lifecycle: commands[m].lifecycle,
          name: `${hookIn.name}.${m}`,
          method: hookIn[m],
          config: commands[m].config
        })
      })
    })
    return this
  }

  /**
   * Add Command Subscriber
   * @param command_type
   * @param type
   * @param lifecycle
   * @param name
   * @param method
   * @param config
   */
  addCommand({command_type, type = 'hook', lifecycle = 'before', name, method, config = {}}): Broadcast {

    const { keys, pattern } = regexdot(command_type)
    const key = command_type // pattern // .toString()

    // Add default configs
    config = {
      type: type,
      priority: 255,
      retry_on_fail: false,
      retry_on_timeout: null,
      retry_max: 0,
      retry_wait: null,
      retry_attempts: 0,
      processing: 'serial',
      params: keys,
      pattern: pattern,
      pattern_raw: command_type,
      metadata: { merge: false },
      ...config
    }

    if (this._commands.has(key)) {
      const command = this._commands.get(key)
      const handler = this._handlers.get(key)

      if (command[lifecycle]) {
        command[lifecycle].set(name, method)
        handler[lifecycle].set(name, config)
      }
      else {
        command[lifecycle] = new Map([[name, method]])
        handler[lifecycle] = new Map([[name, config]])
      }
    }
    else {
      this._commands.set(key, {
        [lifecycle]: new Map([[name, method]])
      })
      this._handlers.set(key, {
        [lifecycle]: new Map([[name, config]])
      })
    }
    return this
  }


  /**
   * Has Command type
   * @param command_type
   */
  hasCommand({command_type}) {
    // return this._commands.has(command_type)
    this._commands.forEach( (subscribers, _k: any) => {
      // const key = _k // new RegExp(_k)
      // const match = key.test('.' + command_type)
      const { pattern, keys } = regexdot(_k)
      const match = pattern.test('.' + command_type)
      if (match) {
        return match
      }
    })
  }
  hasHandler({command_type}) {
    // return this._handlers.has(command_type)
    this._handlers.forEach( (subscribers, _k: any) => {
      // const key = _k // new RegExp(_k)
      // const match = key.test('.' + command_type)
      const { pattern, keys } = regexdot(_k)
      const match = pattern.test('.' + command_type)
      if (match) {
        return match
      }
    })
  }



  /**
   * Get hooks by type with before consitency
   * @param command_type
   */
  getBeforeHooks(command_type): Map<string, any> {
    // if (this._commands.has(command_type)) {
    //   const hooks = this._commands.get(command_type)
    //   if (hooks['before']) {
    //     return hooks['before']
    //   }
    // }
    // return new Map()

    let _commands = []

    this._commands.forEach( (commands, _k: any) => {
      // const key = _k // new RegExp(_k)
      //
      // const match = key.test('.' + command_type)
      const { pattern, keys } = regexdot(_k)
      const match = pattern.test('.' + command_type)

      if (match && commands['before']) {
        _commands = [..._commands, ...commands['before']]
      }
    })
    return new Map(_commands)
  }

  /**
   * Get hooks by type with before consitency
   * @param command_type
   */
  getBeforeHandlers(command_type): Map<string, any> {
    // if (this._handlers.has(command_type)) {
    //   const handlers = this._handlers.get(command_type)
    //   if (handlers['before']) {
    //     return handlers['before']
    //   }
    // }
    // return new Map()
    let _commands = []

    this._handlers.forEach( (commands, _k: any) => {
      // const key = _k // new RegExp(_k)
      // const match = key.test('.' + command_type)
      const { pattern, keys } = regexdot(_k)
      const match = pattern.test('.' + command_type)

      if (match && commands['before']) {
        _commands = [..._commands, ...commands['before']]
      }
    })
    return new Map(_commands)
  }

  /**
   * Get hooks by type with after consitency
   * @param command_type
   */
  getAfterHooks(command_type): Map<string, any> {
    // if (this._commands.has(command_type)) {
    //   const hooks = this._commands.get(command_type)
    //   if (hooks['after']) {
    //     return hooks['after']
    //   }
    // }
    // return new Map()

    let _commands = []

    this._commands.forEach( (commands, _k: any) => {
      // const key = _k // new RegExp(_k)
      // const match = key.test('.' + command_type)
      const { pattern, keys } = regexdot(_k)
      const match = pattern.test('.' + command_type)

      if (match && commands['after']) {
        _commands = [..._commands, ...commands['after']]
      }
    })
    return new Map(_commands)
  }

  /**
   * Get hooks by type with after consitency
   * @param command_type
   */
  getAfterHandlers(command_type): Map<string, any> {
    // if (this._handlers.has(command_type)) {
    //   const handlers = this._handlers.get(command_type)
    //   if (handlers['after']) {
    //     return handlers['after']
    //   }
    // }
    // return new Map()
    let _commands = []

    this._handlers.forEach( (commands, _k: any) => {
      // const key = _k // new RegExp(_k)
      // const match = key.test('.' + command_type)
      const { pattern, keys } = regexdot(_k)
      const match = pattern.test('.' + command_type)

      if (match && commands['after']) {
        _commands = [..._commands, ...commands['after']]
      }
    })
    return new Map(_commands)
  }

  hooks() {
    return this._hooks
  }

  commands() {
    return this._commands
  }

  handlers() {
    return this._handlers
  }

  /**
   * Utility Function
   * @param str
   */
  getHookInFromString(str): BroadcastHookIn {
    return get(this.app.hooks, str)
  }

  /**
   * Remove Command Subscriber
   * @param command_type
   * @param lifecycle
   * @param name
   */
  removeCommand({command_type, lifecycle = 'before', name}): Broadcast {
    const { pattern, keys } = regexdot(command_type)
    const key = command_type // pattern .toString()

    if (this._commands.has(key)) {
      const command = this._commands.get(key)
      const handler = this._handlers.get(key)
      if (command[lifecycle]) {
        command[lifecycle].delete(name)
        handler[lifecycle].delete(name)
      }
    }
    return this
  }

  /**
   * Add a Projector
   * @param projector
   */
  addProjector (projector: BroadcastProjector) {

    if (!(projector instanceof BroadcastProjector)) {
      throw new Error(`${projector} is not an instance of Projector`)
    }

    this._projectors.set(projector.name, projector)

    const config = this.app.config.get(`broadcast.projectors.${projector.name}.broadcasters.${this.name}`)
    const eventTypes = Object.keys(config || {})

    eventTypes.forEach(eventType => {
      const methods = Object.keys(config[eventType])
      const events = config[eventType]

      methods.forEach(m => {
        if (typeof projector[m] !== 'function') {
          throw new this.app.errors.GenericError(
            'E_FAILED_DEPENDENCY',
            `Projector ${projector.name}.${m} is not a function, check config/broadcast projectors`
          )
        }
        if (!m) {
          throw new Error(`${projector.name} method is undefined`)
        }

        const { error } = projectorConfig.validate(events[m].config)

        if (error) {
          throw new this.app.errors.GenericError(
            'E_BAD_CONFIG',
            `${projector.name} config is invalid`
          )
        }

        projector.managers.set(eventType, m)

        this.app.log.silly(
          `Adding projector ${projector.name}.${m} to broadcaster ${this.name} for event ${eventType}`
        )

        this.addEvent({
          event_type: eventType,
          type: 'projector',
          consistency: events[m].consistency,
          name: `${projector.name}.${m}`,
          method: projector[m],
          config: events[m].config
        })
      })
    })

    return this
  }

  /**
   * Add a BroadcastProcessor
   * @param processor
   */
  addProcessor (processor: BroadcastProcessor) {

    if (!(processor instanceof BroadcastProcessor)) {
      throw new Error(`${processor} is not an instance of Processor`)
    }

    this._processors.set(processor.name, processor)

    const config = this.app.config.get(`broadcast.processors.${processor.name}.broadcasters.${this.name}`)
    const eventTypes = Object.keys(config || {})

    eventTypes.forEach(eventType => {
      const methods = Object.keys(config[eventType])
      const events = config[eventType]

      methods.forEach(m => {
        if (typeof processor[m] !== 'function') {
          throw new this.app.errors.GenericError(
            'E_FAILED_DEPENDENCY',
            `Processor ${processor.name}.${m} is not a function, check config/broadcast processors`
          )
        }
        if (!m) {
          throw new this.app.errors.GenericError(
            'E_FAILED_DEPENDENCY',
            `${processor.name} method is undefined`
          )
        }

        // const {error} = joi.validate(events[m].config, processorConfig)
        const {error} = processorConfig.validate(events[m].config)

        if (error) {
          throw new this.app.errors.GenericError('E_BAD_CONFIG',
            `${processor.name} config is invalid`
          )
        }

        processor.managers.set(eventType, m)

        this.app.log.silly(`Adding processor ${processor.name}.${m} to broadcaster ${this.name} for event ${eventType}`)
        this.addEvent({
          event_type: eventType,
          type: 'processor',
          consistency: events[m].consistency,
          name: `${processor.name}.${m}`,
          method: processor[m],
          config: events[m].config,
        })
      })
    })

    return this
  }

  /**
   * Add Event Subscriber
   * @param event_type
   * @param consistency
   * @param name
   * @param method
   * @param config
   * @param type
   */
  addEvent({event_type, consistency = 'strong', name, method, config = {}, type = 'projector'}): Broadcast {


    const { keys, pattern } = regexdot(event_type)
    const key =  event_type // pattern // .toString()

    // Add default configs
    // These values will get replaced by the config if set
    config = {
      type: type,
      priority: 255,
      retry_on_fail: false,
      retry_on_timeout: null,
      retry_max: 0,
      retry_wait: null,
      retry_attempts: 0,
      // By Default, processors or strong projectors should be serial because of transactions
      processing: type === 'processor' || consistency === 'strong' ? 'serial' : 'parallel',
      params: keys,
      pattern: pattern,
      pattern_raw: event_type,
      consistency: consistency,
      metadata: { merge: false },
      ...config
    }

    // let added = false
    // this._events.forEach((value, _key, map) => {
    //   if (!added && _key.toString() === key.toString()) {
    //
    //     if (event[consistency]) {
    //       event[consistency].set(name, method)
    //       manager[consistency].set(name, config)
    //     }
    //     else {
    //       event[consistency] = new Map([[name, method]])
    //       manager[consistency] = new Map([[name, config]])
    //     }
    //
    //     added = true
    //   }
    // })
    // if (!added) {
    //   this._events.set(key, {
    //     [consistency]: new Map([[name, method]])
    //   })
    //   this._managers.set(key, {
    //     [consistency]: new Map([[name, config]])
    //   })
    // }

    if (this._events.has(key)) {
      const event = this._events.get(key)
      const manager = this._managers.get(key)

      if (event[consistency]) {
        event[consistency].set(name, method)
        manager[consistency].set(name, config)
      }
      else {
        event[consistency] = new Map([[name, method]])
        manager[consistency] = new Map([[name, config]])
      }
    }
    else {
      this._events.set(key, {
        [consistency]: new Map([[name, method]])
      })
      this._managers.set(key, {
        [consistency]: new Map([[name, config]])
      })
    }
    return this
  }

  /**
   * Has Event type
   * @param event_type
   */
  hasEvent({event_type}) {
    // return this._events.has(event_type)
    this._events.forEach( (subscribers, _k: any) => {
      const { pattern, keys } = regexdot(_k)
      const match = pattern.test('.' + event_type)
      if (match) {
        return match
      }
    })
  }
  hasManager({event_type}) {
    // return this._events.has(event_type)
    this._managers.forEach( (subscribers, _k: any) => {
      const { pattern, keys } = regexdot(_k)
      const match = pattern.test('.' + event_type)

      if (match) {
        return match
      }
    })
  }

  /**
   * Remove Event Subscriber
   * @param event_type
   * @param consistency
   * @param name
   */
  removeEvent({event_type, consistency = 'strong', name}): Broadcast {
    const { pattern, keys } = regexdot(event_type)
    const key = event_type

    if (this._events.has(key)) {
      const event = this._events.get(key)
      const manager = this._managers.get(key)
      if (event[consistency]) {
        event[consistency].delete(name)
        manager[consistency].delete(name)
      }
    }
    return this
  }

  /**
   * Get events by type with strong consitency
   * @param event_type
   */
  getStrongEvents(event_type): Map<string, any> {
    // if (this._events.has(event_type)) {
    //   const events = this._events.get(event_type)
    //   if (events['strong']) {
    //     return events['strong']
    //   }
    // }
    // return new Map()
    let _events = []

    this._events.forEach( (events, _k: any) => {
      const { pattern, keys } = regexdot(_k)
      const match = pattern.test('.' + event_type)

      if (match && events['strong']) {
        _events = [..._events, ...events['strong']]
      }
    })
    return new Map(_events)
  }

  /**
   * Get events by type with strong consitency
   * @param event_type
   */
  getStrongManagers(event_type): Map<string, any> {
    // if (this._managers.has(event_type)) {
    //   const managers = this._managers.get(event_type)
    //   if (managers['strong']) {
    //     return managers['strong']
    //   }
    // }
    // return new Map()
    let _events = []

    this._managers.forEach( (events, _k: any) => {
      // const key = new RegExp(_k, 'i')
      // const match = key.test('.' + event_type)
      const { pattern, keys } = regexdot(_k)
      const match = pattern.test('.' + event_type)

      if (match && events['strong']) {
        _events = [..._events, ...events['strong']]
      }
    })
    return new Map(_events)
  }

  /**
   * Get events by type with eventual consistency
   * @param event_type
   */
  getEventualEvents(event_type): Map<string, any> {
    // if (this._events.has(event_type)) {
    //   const events = this._events.get(event_type)
    //   if (events['eventual']) {
    //     return events['eventual']
    //   }
    // }
    // return new Map()
    let _events = []

    this._events.forEach( (events, _k: any) => {
      // const key = _k // new RegExp(_k)
      // const match = key.test('.' + event_type)
      const { pattern, keys } = regexdot(_k)
      const match = pattern.test('.' + event_type)

      if (match && events['eventual']) {
        _events = [..._events, ...events['eventual']]
      }
    })
    return new Map(_events)
  }

  /**
   * Get events by type with eventual consistency
   * @param event_type
   */
  getEventualManagers(event_type): Map<string, any> {
    // if (this._managers.has(event_type)) {
    //   const managers = this._managers.get(event_type)
    //   if (managers['eventual']) {
    //     return managers['eventual']
    //   }
    // }
    // return new Map()
    let _events = []

    this._managers.forEach( (events, _k: any) => {
      // const key = _k // new RegExp(_k)
      // const match = key.test('.' + event_type)
      const { pattern, keys } = regexdot(_k)
      const match = pattern.test('.' + event_type)

      if (match && events['eventual']) {
        _events = [..._events, ...events['eventual']]
      }
    })
    return new Map(_events)
  }

  /**
   * Utility Function
   * Get all event handlers (regardless if processor or projector)
   */
  events() {
    return this._events
  }
  // eventualEvents() {
  //   console.log('BRK EVENTUAL', this._events)
  //   return this._events
  // }
  projectors() {
    return this._projectors
  }
  processors() {
    return this._processors
  }

  /**
   * Utility Function
   * Get all event managers (regardless if processor or projector)
   */
  managers() {
    return this._managers
  }

  /**
   * Utility Function
   * @param str
   */
  getProjectorFromString(str): BroadcastProjector {
    return get(this.app.projectors, str)
  }

  /**
   * Utility Function
   * @param str
   */
  getProjectorMethodFromString(str) {
    const projector = this.getProjectorFromString(str)
    const method = str.split('.').pop()
    return projector[method]
  }

  /**
   * Remove a Projector
   * @param projector
   */
  removeProjector (projector: BroadcastProjector) {
    this._projectors.delete(projector.name)
    return this
  }

  /**
   * Utility Function
   * If Broadcast has projector in map
   * @param projector
   */
  hasProjector (projector) {
    return this._projectors.has(projector.name)
  }
}
