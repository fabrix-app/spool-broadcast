import { FabrixApp } from '@fabrix/fabrix'
import { FabrixGeneric, FabrixModel } from '@fabrix/fabrix/dist/common'
import { get, isArray } from 'lodash'
import joi from 'joi'
import { projectorConfig, processorConfig, hookConfig, pipeConfig } from './schemas'

import { Hook, HookIn } from './Hook'
import { Pipeline, Pipe, PipelineEmitter } from './Pipeline'
import { Project, Projector } from './Projector'
import { Processor } from './Processer'
import { BroadcastEvent } from './api/models'
import { Command } from './Command'
import { GenericError } from '@fabrix/spool-errors/dist/errors'

// import { each, mapSeries } from 'Bluebird'


export class Broadcast extends FabrixGeneric {

  public lifecycles = ['before', 'after']
  public consistencies = ['strong', 'eventual']
  public processing = ['serial', 'parallel']

  private _hooks: Map<string, HookIn> = new Map()
  private _commands: Map<string, { [key: string]: Map<string, any> }> = new Map()
  private _handlers: Map<string, { [key: string]: Map<string, any> }> = new Map()

  private _processors: Map<string, Processor> = new Map()
  private _projectors: Map<string, Projector> = new Map()
  private _events: Map<string, { [key: string]: Map<string, any> }> = new Map()
  private _managers: Map<string, { [key: string]: Map<string, any> }> = new Map()

  private _pipelines: Map<string, Pipeline> = new Map()
  private _pipes: Map<string, { [key: string]: Map<string, any> }> = new Map()
  private _runners: Map<string, { [key: string]: Map<string, any> }> = new Map()

  /**
   * Get's the name of the Broadcast class
   */
  get name() {
    return this.constructor.name
  }

  subscribe(command, req = {}, body = {}, options = {}) {
    if (!this._pipes.has(command)) {
      throw new Error(`${command} is not a valid pipeline for ${this.anme}`)
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
  }

  /**
   * Run Serial TODO or in Parallel
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

    return this.app.spools.sequelize._datastore.Promise.mapSeries(...args)
      .catch(err => {
        this.app.log.err('Fatal Process', err)
        return Promise.reject(err)
      })
  }

  reverseProcess(managers, ...args) {
    return this.app.spools.sequelize._datastore.Promise.mapSeries(...args)
      .catch(err => {
        this.app.log.err('Fatal Process', err)
        return Promise.reject(err)
      })
  }

  /**
   * Create a command
   * @param data
   */
  createCommand(data) {
    return new Command(this.app, this, data)
  }

  /**
   * Update a command
   * Sets a correlation ID and returns a new command
   * @param data
   */
  updateCommand(data) {
    return new Command(this.app, this, {correlation_uuid: data.command_uuid, ...data})
  }

  /**
   * Build Event from command infBRK beforeCommandAscormation
   * @param event_type
   * @param correlation_uuid
   * @param causation_uuid
   * @param command
   * @param chain_before
   * @param chain_saga
   * @param chain_after
   * @param chain_events
   */
  buildEvent({
     command,
     event_type,
     correlation_uuid,
     causation_uuid,
     chain_before,
     chain_saga,
     chain_after,
     chain_events
  }: {
    command: Command,
    // Overrides
    event_type?: string,
    correlation_uuid: string,
    causation_uuid?: string,
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
    if (!(command instanceof Command)) {
      throw new Error('Broadcast.buildEvent called with a non Command object')
    }

    const data = {
      event_type, // || command.event_type,
      // This is the command uuid that started this event chain
      correlation_uuid,
      // The causation_uuid my have been part of a another new event (processor dispatched)
      causation_uuid: causation_uuid || command.causation_uuid,
      chain_before: chain_before || command.chain_before,
      chain_saga: chain_saga || command.chain_saga,
      chain_after: chain_after || command.chain_after,
      chain_events: chain_events || command.chain_events,
      ...command
    }

    return this.app.models.BroadcastEvent.stage(data, { isNewRecord: true }).generateUUID()
  }

  /**
   * Call toJSON on each "Sequelize Model"
   * @param obj
   * @private
   */
  _cleanObj(obj) {
    const cleanObj = isArray(obj)
      ? obj.map(d => d.toJSON ? d.toJSON() : d)
      : obj.toJSON
      ? obj.toJSON()
      : obj

    return cleanObj
  }

  /**
   * Run provided validator over command data that is cleaned to JSON throws spool-error standard on failure
   * @param validator
   * @param value
   * @param options
   */
  validate(validator, value, options) {
    return validator(this._cleanObj(value.data))
      .then(data => {
        return [value, options]
      })
      .catch(error => {
        console.log('brk test error', error)
        const err = this.app.transformJoiError({ value, error })
        return Promise.reject(err.error)
      })
  }

  /**
   * Run Sequence of Hooks before 3rd Party SAGA
   * @param command
   * @param options
   * @param validator
   */
  before(command: Command, options, validator) {
    if (!(command instanceof Command)) {
      throw new this.app.errors.GenericError(
        'E_FAILED_DEPENDENCY',
        'command is not an instance of Command'
      )
    }
    return this.beforeCommand(command, options, validator)
      .catch(err => {
        this.app.log.error(`${this.name} Failure before ${command.command_type} - fatal`, err)
        // TODO reverse SAGA
        return [command, options]
      })
  }

  /**
   * Run Sequence of Hooks after 3rd Party SAGA
   * @param command
   * @param options
   * @param validator
   */
  after(command: Command, options, validator) {
    if (!(command instanceof Command)) {
      throw new Error('command is not an instance of Command')
    }
    return this.afterCommand(command, options, validator)
      .catch(err => {
        this.app.log.error(`${this.name} Failure after ${command.command_type} - fatal`, err)
        // TODO reverse SAGA
        return [command, options]
      })
  }

  /**
   * Before a command heads to 3rd parties
   * @param command
   * @param options
   * @param validator
   */
  beforeCommand(command: Command, options, validator) {

    const beforeHooks = this.getBeforeHooks(command.command_type)
    const beforeHandlers = this.getBeforeHandlers(command.command_type)

    if (!beforeHooks || !beforeHandlers) {
      const err = new this.app.errors.GenericError('E_PRECONDITION_REQUIRED', 'Before Commands/Handlers are not defined')
      return Promise.reject(err)
    }
    return this.runBefore(beforeHooks, beforeHandlers, command, options, validator)
  }

  /**
   * After a command heads to 3rd parties
   * @param command
   * @param options
   * @param validator
   */
  afterCommand(command: Command, options, validator) {

    const afterHooks = this.getAfterHooks(command.command_type)
    const afterHandlers = this.getAfterHandlers(command.command_type)

    if ( !afterHooks || !afterHandlers) {
      const err = new this.app.errors.GenericError('E_PRECONDITION_REQUIRED', 'After Commands/Handler are not defined')
      return Promise.reject(err)
    }
    return this.runAfter(afterHooks, afterHandlers, command, options, validator)
  }

  /**
   * Run the Before Commands
   * @param beforeCommands
   * @param beforeHandlers
   * @param command
   * @param options
   * @param validator
   */
  runBefore(beforeCommands, beforeHandlers, command, options, validator) {
    let breakException
    // Setup Before Commands in priority order
    const beforeCommandsAsc = new Map([...beforeCommands.entries()].sort((a, b) => {
      return beforeHandlers.get(a[0]).priority - beforeHandlers.get(b[0]).priority
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

    return this.process(beforeHandlers, promises, ([m, p]) => {
      if (breakException) {
        return Promise.reject(breakException)
      }
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
        lifecycle: 'before'
      })
        .run()
        .then(([_command, _options]) => {
          if (!_command) { // || !_command.data) {
            throw new this.app.errors.GenericError(
              'E_FAILED_DEPENDENCY',
              `${this.name}: ${p.name} Hook returned invalid response for ${m}! - fatal`
            )
          }
          if (!(_command instanceof Command)) {
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
          return this.validate(validator, _command, options)
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

          const handler = beforeHandlers.get(m)

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
            this.app.log.debug(`${this.name}: Before Handler ${m} included data as ${handler.includeAs}`)
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
   * @param validator
   */
  runAfter(afterCommands, afterHandlers, command, options, validator) {
    let breakException
    // Setup After Commands in priority order
    const afterCommandsAsc = new Map([...afterCommands.entries()]
      .sort((a, b) => {
        return afterHandlers
          .get(a[0]).priority - afterHandlers.get(b[0])
          .priority
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

    return this.process(afterHandlers, promises, ([m, p]) => {
      if (breakException) {
        return Promise.reject(breakException)
      }
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
        lifecycle: 'after'
      })
        .run()
        .then(([_command, _options]) => {
          if (!_command) { // || !_command.data) {
            throw new this.app.errors.GenericError(
              'E_FAILED_DEPENDENCY',
              `${p.name} Hook returned invalid response for ${m}! - fatal`
            )
          }
          if (!(_command instanceof Command)) {
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

          return this.validate(validator, _command, options)
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

          const handler = afterHandlers.get(m)

          if (handler && handler.merge && handler.merge !== false) {
            command.mergeData(m, handler, _command)
          }
          if (handler && handler.push && handler.push !== false) {
            command.pushOn(m, handler, _command)
          }
          if (handler && handler.zip && handler.zip !== false) {
            command.zip(m, handler, _command)
          }
          if (handler && handler.include === true) {
            command.includeAs(m, handler, _command)
            this.app.log.debug(`After Handler ${m} included data as ${handler.includeAs}`)
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
   * Save event and Broadcast the event to the projectors
   * @param event
   * @param options
   */
  broadcast(event: BroadcastEvent, options) {

    if (!(event instanceof this.app.models.BroadcastEvent.instance)) {
      throw new this.app.errors.GenericError(
        'E_FAILED_DEPENDENCY',
        'event is not an instance of BroadcastEvent'
      )
    }
    if (typeof event.object.toBinaryData === 'undefined') {
      throw new this.app.errors.GenericError(
        'E_FAILED_DEPENDENCY',
        'Data object does not have a toBinaryData function'
      )
    }
    if (typeof event.object.toBinaryMetadata === 'undefined') {
      throw new this.app.errors.GenericError(
        'E_FAILED_DEPENDENCY',
        'Data object does not have a toBinaryMetadata function'
      )
    }
        // Send to the projectors TODO SBW
    return this.project(event, options)
      .then(([_event, _options]) => {
        return event.save(options)
          .then(() => {
            return [event, options]
          })
      })
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
    //         // TODO reverse SAGA
    //         return [event, options]
    //       })
    //   })
      .then(([_e, _o]) => {
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

  bulkBroadcast(events: BroadcastEvent[] = [], options) {
    return this.process(new Map(), events, e => this.broadcast(e, options))
  }

  /**
   * Given an options with a transaction tree, find the top most level transaction
   * @param options
   */
  unnestTransaction(options) {
    if (options && options.parent && options.parent.transaction) {
      if (options.transaction) {
        this.app.log.debug(options.transaction.id, 'will await', options.parent.transaction.id)
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
  /**
   * Project the event that was persisted
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

    // Publish the strong events
    return this.projectStrong(strong, strongManagers, event, options)
      .then(([_event, _options]) => {

        const elog = []
        eventual.forEach((v, k) => elog.push(k))
        // Check that there is something subscribed to this
        const topLevelTransaction = this.unnestTransaction(options)

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
            return this.projectEventual(eventual, eventualManagers, _event, _options)
              .then(results => [_event, _options])
              .catch(err => {
                this.app.log.error(`${event.event_type} Broadcast.project.projectEventual after commit`, err)
                throw new Error(err)
              })
          })

          return [_event, _options]
        }
        else if (eventual.size > 0) {
          this.app.log.debug(
            `Broadcaster ${this.name} broadcasting on independent transaction`,
            `${ eventual.size } eventual for event ${_event.event_type}`,
            `: ${elog.map(k => k).join(' -> ')}`
          )
          // Publish the eventual events
          return this.projectEventual(eventual, eventualManagers, _event, _options)
            .then(results => [_event, _options])
            .catch(err => {
              // TODO better define this error
              this.app.log.error('Broadcast.project.projectEventual independent transaction', err)
              throw new this.app.errors.GenericError(err)
            })
        }
        // No eventual listeners, just return
        else {
          return [_event, _options]
        }
      })
      .then(([_event, _options]) => {
        // Return the original event
        return [_event, _options]
      })
  }

  /**
   * Project the Strong Events
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

      // Receiver Test
      if (manager.receives) {
        if (typeof manager.receives === 'string' && event.getDataValue('object') !== manager.receives) {
          throw new this.app.errors.GenericError(
            'E_PRECONDITION_FAILED',
            `${m} processor receives ${manager.receives} but got ${event.getDataValue('object')} for ${event.event_type}`
          )
        }
        else if (Array.isArray(manager.receives) && manager.receives.indexOf(event.getDataValue('object')) === -1) {
          throw new this.app.errors.GenericError(
            'E_PRECONDITION_FAILED',
            `${m} processor receives one of ${manager.receives.join(', ')} but got ${event.getDataValue('object')} for ${event.event_type}`
          )
        }
      }
      else {
        this.app.log.debug(`${event.event_type} manager ${m} processor assuming it receives ${event.getDataValue('object')}`)
      }

      // Check and promise events
      if (!p || typeof p !== 'function') {
        this.app.log.warn(`${m} attempted to call a non function ${p}! - returning`)
        return [event, options]
      }

      // Get the time for the start of the hook
      const projectstart = process.hrtime()

      return p({
        event,
        options,
        consistency: 'strong'
      })
        .run()
        .then(([_event, _options]) => {
          if (!_event) {
            throw new this.app.errors.GenericError(
              'E_FAILED_DEPENDENCY',
              `${p.name} Projection returned no event for ${m}! - fatal`
            )
          }
          else if (!isArray(_event)) {
            if (!_event) {
              throw new this.app.errors.GenericError(
                'E_NOT_ACCEPTABLE',
                `${p.name} Projection returned invalid response for ${m}! - fatal`
              )
            }
            if (_event instanceof Command) {
              throw new this.app.errors.GenericError(
                'E_NOT_ACCEPTABLE',
                `${p.name} Projection returned a Command instead of an Event for ${m}! - fatal`
              )
            }

            if (_event.action && _event.action === 'retry') {
              this.app.log.error(`${p.name} BRK unhandled retry action for ${m}`)
              return [event, options]
            }
            if (_event.action === false) {
              this.app.log.debug(`${m} to continue without data`)
              return [event, options]
            }
          }
          else {
            _event.forEach(_e => {
              if (!_e) {
                throw new this.app.errors.GenericError(
                  'E_UNPROCESSABLE_ENTITY',
                  `${p.name} Projection returned invalid response for ${m}! - fatal`
                )
              }
              if (_e[0] instanceof Command) {
                throw new this.app.errors.GenericError(
                  'E_NOT_ACCEPTABLE',
                  `${p.name} Projection returned a Command instead of an Event for ${m}! - fatal`)
              }
            })
            if (_event.every(_e => _e[0].action && _e[0].action === 'retry')) {
              this.app.log.debug.error(`${p.name} BRK unhandled retry action for ${m} in list of events`)
              return [event, options]
            }
            if (_event.every(_e => _e[0].action && _e[0].action === false)) {
              this.app.log.debug(`${m} to continue without data in list of events`)
              return [event, options]
            }
          }

          this.app.log.silly('chain_events', event.chain_events)
          event.chain_events.push(m)

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


          const projectend = process.hrtime(projectstart)
          const t = `${manager.is_processor ? 'Processor' : 'Projector'}`
          this.app.log.debug(
            `${this.name}.${m}: ${_event.event_type} ${t} Execution time (hr): ${projectend[0]}s ${projectend[1] / 1000000}ms`
          )

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
   * Project Eventual
   * @param eventualEvents
   * @param eventualManagers
   * @param event
   * @param options
   */
  projectEventual(eventualEvents, eventualManagers, event, options) {

    eventualEvents.forEach(e => {
      event.chain_events.push(e)
    })

    // Publish the eventual events
    return this.app.broadcaster.publish({
      broadcaster: this,
      event_type: `${event.event_type}`,
      event: event,
      options: options,
      consistency: 'eventual'
    })
  }


  pipelines() {
    return this._pipelines
  }

  runners() {
    return this._runners
  }

  /**
   * Add a Pipeline
   * @param pipeline
   */
  addPipeline (pipeline: Pipeline) {

    if (!(pipeline instanceof Pipeline)) {
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

        const { error } = joi.validate(pipes[m].config, pipeConfig)

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
   * Add Pipe Subscriber
   * @param pipe_type
   * @param name
   * @param method
   * @param config
   */
  addPipe({pipe_type, name, method, config = {}}): Broadcast {

    const lifecycle = 'always'

    // // Add default configs
    config = {
      failOnError: true,
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
   * Has Pipe type
   * @param pipe_type
   */
  hasPipe({pipe_type}) {
    return this._pipes.has(pipe_type)
  }
  hasRunner({pipe_type}) {
    return this._runners.has(pipe_type)
  }


  /**
   * Add a HookIn
   * @param hookIn
   */
  addHookIn (hookIn: HookIn) {

    if (!(hookIn instanceof HookIn)) {
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

        const {error} = joi.validate(commands[m].config, hookConfig)

        if (error) {
          throw new Error(`${hookIn.name} config is invalid`)
        }

        this.app.log.silly(`Adding hookIn ${hookIn.name}.${m} to broadcaster ${this.name} for command ${commandType}`)
        this.addCommand({
          command_type: commandType,
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
   * @param lifecycle
   * @param name
   * @param method
   * @param config
   */
  addCommand({command_type, lifecycle = 'before', name, method, config = {}}): Broadcast {

    // Add default configs
    config = {
      priority: 255,
      retry_limit: 0,
      ...config
    }

    if (this._commands.has(command_type)) {
      const command = this._commands.get(command_type)
      const handler = this._handlers.get(command_type)

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
      this._commands.set(command_type, {
        [lifecycle]: new Map([[name, method]])
      })
      this._handlers.set(command_type, {
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
    return this._commands.has(command_type)
  }
  hasHandler({command_type}) {
    return this._handlers.has(command_type)
  }



  /**
   * Get hooks by type with before consitency
   * @param command_type
   */
  getBeforeHooks(command_type): Map<string, any> {
    if (this._commands.has(command_type)) {
      const hooks = this._commands.get(command_type)
      if (hooks['before']) {
        return hooks['before']
      }
    }
    return new Map()
  }

  /**
   * Get hooks by type with before consitency
   * @param command_type
   */
  getBeforeHandlers(command_type): Map<string, any> {
    if (this._handlers.has(command_type)) {
      const handlers = this._handlers.get(command_type)
      if (handlers['before']) {
        return handlers['before']
      }
    }
    return new Map()
  }

  /**
   * Get hooks by type with after consitency
   * @param command_type
   */
  getAfterHooks(command_type): Map<string, any> {
    if (this._commands.has(command_type)) {
      const hooks = this._commands.get(command_type)
      if (hooks['after']) {
        return hooks['after']
      }
    }
    return new Map()
  }

  /**
   * Get hooks by type with after consitency
   * @param command_type
   */
  getAfterHandlers(command_type): Map<string, any> {
    if (this._handlers.has(command_type)) {
      const handlers = this._handlers.get(command_type)
      if (handlers['after']) {
        return handlers['after']
      }
    }
    return new Map()
  }

  hooks() {
    return this._hooks
  }

  handlers() {
    return this._handlers
  }

  /**
   * Utility Function
   * @param str
   */
  getHookInFromString(str): HookIn {
    return get(this.app.hooks, str)
  }

  /**
   * Remove Command Subscriber
   * @param command_type
   * @param lifecycle
   * @param name
   */
  removeCommand({command_type, lifecycle = 'before', name}): Broadcast {
    if (this._commands.has(command_type)) {
      const command = this._commands.get(command_type)
      const handler = this._handlers.get(command_type)
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
  addProjector (projector: Projector) {

    if (!(projector instanceof Projector)) {
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

        const {error} = joi.validate(events[m].config, projectorConfig)

        if (error) {
          throw new this.app.errors.GenericError(
            'E_BAD_CONFIG',
            `${projector.name} config is invalid`
          )
        }

        this.app.log.silly(`Adding projector ${projector.name}.${m} to broadcaster ${this.name} for event ${eventType}`)
        this.addEvent({
          event_type: eventType,
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
   * Add a Processor
   * @param processor
   */
  addProcessor (processor: Processor) {

    if (!(processor instanceof Processor)) {
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

        const {error} = joi.validate(events[m].config, processorConfig)

        if (error) {
          throw new this.app.errors.GenericError('E_BAD_CONFIG',
            `${processor.name} config is invalid`
          )
        }

        this.app.log.silly(`Adding processor ${processor.name}.${m} to broadcaster ${this.name} for event ${eventType}`)
        this.addEvent({
          event_type: eventType,
          consistency: events[m].consistency,
          name: `${processor.name}.${m}`,
          method: processor[m],
          config: events[m].config,
          is_processor: true,
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
   * @param is_processor
   */
  addEvent({event_type, consistency = 'strong', name, method, config = {}, is_processor = false}): Broadcast {

    // Add default configs
    config = {
      priority: 255,
      retry_limit: 0,
      processing: 'serial',
      is_processor: is_processor,
      ...config
    }

    if (this._events.has(event_type)) {
      const event = this._events.get(event_type)
      const manager = this._managers.get(event_type)

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
      this._events.set(event_type, {
        [consistency]: new Map([[name, method]])
      })
      this._managers.set(event_type, {
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
    return this._events.has(event_type)
  }
  hasManager({event_type}) {
    return this._managers.has(event_type)
  }

  /**
   * Remove Event Subscriber
   * @param event_type
   * @param consistency
   * @param name
   */
  removeEvent({event_type, consistency = 'strong', name}): Broadcast {
    if (this._events.has(event_type)) {
      const event = this._events.get(event_type)
      const manager = this._managers.get(event_type)
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
    if (this._events.has(event_type)) {
      const events = this._events.get(event_type)
      if (events['strong']) {
        return events['strong']
      }
    }
    return new Map()
  }

  /**
   * Get events by type with strong consitency
   * @param event_type
   */
  getStrongManagers(event_type): Map<string, any> {
    if (this._managers.has(event_type)) {
      const managers = this._managers.get(event_type)
      if (managers['strong']) {
        return managers['strong']
      }
    }
    return new Map()
  }

  /**
   * Get events by type with eventual consitency
   * @param event_type
   */
  getEventualEvents(event_type): Map<string, any> {
    if (this._events.has(event_type)) {
      const events = this._events.get(event_type)
      if (events['eventual']) {
        return events['eventual']
      }
    }
    return new Map()
  }

  /**
   * Get events by type with eventual consitency
   * @param event_type
   */
  getEventualManagers(event_type): Map<string, any> {
    if (this._managers.has(event_type)) {
      const managers = this._managers.get(event_type)
      if (managers['eventual']) {
        return managers['eventual']
      }
    }
    return new Map()
  }

  /**
   * Utility Function
   * Get all event handlers (regardless if processor or projector)
   */
  events() {
    return this._events
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
  getProjectorFromString(str): Projector {
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
  removeProjector (projector: Projector) {
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
