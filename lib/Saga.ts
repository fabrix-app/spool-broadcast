// tslint:disable:max-line-length
import { FabrixGeneric as Generic, FabrixModel } from '@fabrix/fabrix/dist/common'
import { get, isArray } from 'lodash'
import { Broadcast } from './Broadcast'
import { BroadcastCommand } from './BroadcastCommand'
import { mapSeries } from 'bluebird'
import { Entry } from './Entry'
import { regexdot } from '@fabrix/regexdot'
import { run } from 'tslint/lib/runner'

export function Story({
  req = null,
  body = null,
  options = null,
  broadcaster,
  command,
  event,
  validator,
  annotations = null,
  docs = null
}) {
  return function(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    // console.log('experimental story', target, propertyKey)
    // var originalMethod = descriptor.value;
    // descriptor.value = function() {
    //   var context = this
    //   var args = arguments;
    //   var later = function() {
    //     timeout = null;
    //     if (!immediate) originalMethod.apply(context, args);
    //   };
    //   var callNow = immediate && !timeout;
    //   clearTimeout(timeout);
    //   timeout = setTimeout(later, wait);
    //   if (callNow) originalMethod.apply(context, args);
    // };
    return descriptor
  }
}
/**
 * @module Saga
 * @description Saga
 */
export class Saga extends Generic  {

  get name() {
    return this.constructor.name
  }

  /**
   * Extracts medata from a request
   * @param req
   */
  metadata(req): {[key: string]: any} {
    // TODO, this should default to an empty object
    return {
      req_user_uuid: req.user ? req.user.user_uuid : null,
      req_channel_uuid: req.channel ? req.channel.channel_uuid : null,
      req_application_uuid: req.application ? req.application.application_uuid : null,
      req_device_uuid: req.device ? req.device.device_uuid : null,
      req_session_uuid: req.channel_session ? req.channel_session.session_uuid : null,
      req_ip: req.ip ? req.ip : null
    }
  }

  async prehookRunner(endpoint, command) {
    // This should be overriden by the subclass
    this.app.log.debug(
      `${this.name}.prehookRunner is not running because it's not defined in the class`,
      `returning [endpoint, command] by default`
    )
    this.app.log.silly(endpoint)
    this.app.log.silly(command)
    return Promise.resolve([endpoint, command])
  }

  /**
   * Temporary until the distributed Model resolver is completed
   * Get's a model by name
   * @param name
   */
  models(name): FabrixModel {
    if (!this.app.spools.broadcast) {
      throw new Error('Spool-broadcast is not loaded!')
    }
    return this.app.spools.broadcast.models(name)
  }
  /**
   * Temporary until the distributed Entries resolver is completed
   * Get's a model by name
   * @param name
   */
  public entries(name): Entry {
    if (!this.app.spools.broadcast) {
      throw new Error('Spool-broadcast is not loaded!')
    }
    return this.app.spools.broadcast.entries(name)
  }

  /**
   * Convenient utility for getting Sequelize
   * @constructor
   */
  public Sequelize() {
    if (!this.app.spools.sequelize) {
      throw new Error('Spool-sequelize is not loaded!')
    }
    return this.app.spools.sequelize._datastore
  }

  /**
   * Map a Series of Commands with transactions
   * @param args
   */
  public mapSeries(...args): Promise<any> {
    if (
      this.app
      && this.app.spools
      && this.app.spools.sequelize
    ) {
      return this.app.broadcastSeries(...args)
    }
    else {
      // return broadcastSeries(...args)
      throw new Error('Spool Sequelize is not yet loaded')
    }
  }

  /**
   * DAO changes
   * @param data
   */
  public changes(data) {
    let changes = []
    if (data && typeof data.changed === 'function') {
      changes = data.changed()
      if (changes) {
        if (!isArray(changes)) {
          throw new Error('metadata changes should be an array')
        }
      }
      else {
        return []
      }
    }
    return changes
  }

  /**
   * Before
   * @param command
   * @param validators
   * @param options
   */
  // TODO send cancels on fail
  public before(command, validators, options: { [key: string]: any} = {}): Promise<any> {

    const ran = new Map()
    const cancelled = new Map()

    const saga = new Map(command.metadata.prehooks || [])

    const sagastart = process.hrtime()
    let hrstart = sagastart, useValidators = []

    Object.keys(validators).forEach(k => {
      const { pattern } = regexdot(k)
      const match = pattern.test('.' + command.command_type)
      if (match) {
        useValidators  = [...useValidators , {[k]: validators[k]}]
      }
    })

    if (!(command instanceof BroadcastCommand)) {
      return Promise.reject(
        new Error(`${this.name}: Command sent to before hook ${command.command_type} is not a command instance`)
      )
    }

    if (!(command.broadcaster instanceof Broadcast)) {
      return Promise.reject(
        new Error(`${this.name}: Command sent to before hook ${command.command_type} did not include a broadcaster instance`)
      )
    }

    if (useValidators.length === 0) {
      return Promise.reject(
        new Error(`${this.name}: Command Validator ${command.command_type} does not exist`)
      )
    }

    return command.broadcaster.before(command, options, useValidators)
      .then(([_command, _options]) => {
        const hrend = process.hrtime(hrstart)
        this.app.log.debug(`${this.name}: ${_command.command_type} Before SAGA Execution time (hr): ${hrend[0]}s ${hrend[1] / 1000000}ms`)
        hrstart = process.hrtime()

        if (_command.breakException) {
          // TODO Reverse
          this.app.log.warn('BRK before hook err', _command.breakException)
          return Promise.reject(_command.breakException)
        }

        return ([_command, _options])
      })
      .catch(err => {
        // TODO Reverse
        this.app.log.warn('BRK before saga err', err)
        return Promise.reject(err)
        // return ([command, options])
      })
      .then(([_command, _options]) => {

        if (_command.breakException) {
          // TODO Reverse
          this.app.log.warn('BRK saga err', _command.breakException)
          return Promise.reject(_command.breakException)
        }
        return this.saga(_command, saga, _options, useValidators)
      })
      .catch(err => {
        // TODO Reverse
        this.app.log.warn('BRK saga err', err)
        return Promise.reject(err)
        // return ([command, options])
      })
      .then(([_command, _options]) => {
        const hrend = process.hrtime(hrstart)
        this.app.log.debug(`${this.name}: ${_command.command_type} SAGA Execution time (hr): ${hrend[0]}s ${hrend[1] / 1000000}ms`)
        hrstart = process.hrtime()

        if (_command.breakException) {
          // TODO Reverse
          this.app.log.warn('BRK after saga err', _command.breakException)
          return Promise.reject(_command.breakException)
        }
        return command.broadcaster.after(_command, _options, useValidators)
      })
      .catch(err => {
        // TODO Reverse
        this.app.log.warn('BRK after saga err', err)
        return Promise.reject(err)
        // return ([command, options])
      })
      .then(([_command, _options]) => {
        const hrend = process.hrtime(hrstart)
        const sagaend = process.hrtime(sagastart)

        this.app.log.debug(`${this.name} ${_command.command_type} After SAGA Execution time (hr): ${hrend[0]}s ${hrend[1] / 1000000}ms`)
        this.app.log.debug(`${this.name} ${_command.command_type} Full SAGA Execution time (hr): ${sagaend[0]}s ${sagaend[1] / 1000000}ms`)

        if (sagaend && sagaend[0] >= 1) {
          this.app.log.warn(`${this.name} ${_command.command_type} SLOW SAGA (hr): ${sagaend[0]}s ${sagaend[1] / 1000000}ms`)
        }

        this.app.log.silly('command chain', _command.command_type, '->', _command.chain)
        return ([_command, _options])
      })
      .catch(err => {
        // TODO Reverse
        this.app.log.warn('BRK end err', err)
        return Promise.reject(err)
        // return ([command, options])
      })
  }

  /**
   * Process the Request and fold the response data into the command data
   * @param command
   * @param prehook
   * @param validators
   * @param options
   */
  async processRequest(command, prehook, validators, options): Promise<any> {

    const manager = {
      lifecycle: 'during',
      pattern: command.pattern,
      pattern_raw: command.pattern_raw,
      object: command.object,
    }

    return this.prehookRunner(prehook, command.toJSON())
      .then(([_prehook, _command]) => {
        return command.broadcaster.validate(validators, _command, options)
      })
      .then(([data, _options]) => {
        command.mergeData(
          `${this.name} Saga`,
          manager,
          data
        )
        return [command, options]
      })
  }

  /**
   * TODO
   * @param command
   * @param prehook
   * @param validators
   * @param options
   */
  async processCancelRequest(command, prehook, validators, options): Promise<any> {
    // This should be overriden by the subclass
    this.app.log.warn(
      `${this.name}.processCancelRequest is not running because it's not defined in the subclass`,
      `returning 200 by default`
    )

    this.app.log.silly(prehook)
    this.app.log.silly(command.toJSON())

    return Promise.resolve([{status: 200}])
  }

  /**
   *
   * @param command
   * @param saga
   * @param options
   * @param validators
   */
  // TODO Send cancel request on failure
  saga(command, saga = new Map(), options, validators): Promise<any> {
    const ran = new Map()
    const cancelled = new Map()

    let breakException

    return this.mapSeries(Array.from(saga), ([k, prehook]) => {
      if (!breakException) {
        return this.processRequest(command, prehook, validators, options)
          .then(([_command, _options]) => {
            // Record the result of each step ran
            ran.set(k, _command)
            //
            return [_command, _options]
          })
          .catch(err => {
            breakException = err
            return
          })
      }
      else {
        return
      }
    })
      .then(() => {
        if (breakException) {
          return Promise.reject(breakException)
        }
        else {
          return Promise.resolve([command, options])
        }
      })
      // Send the cancel request to all that ran
      .catch(err => {
        return this.mapSeries(Array.from(ran), ([k, prehook]) => {
          return this.processCancelRequest(command, prehook, validators, options)
            .then(([_command, _options]) => {
              // Record the result of each step ran
              cancelled.set(k, _command)
              //
              return [_command, _options]
            })
        })
          .then(() => {
            if (breakException) {
              return Promise.reject(breakException)
            }
            else {
              return Promise.resolve([command, options])
            }
          })
      })
  }

}


// Promise.config({
//   // Enable cancellation
//   cancellation: true,
// });
//
// // store the promise
// var p = PromiseA().then(function(dataA){
//   if (dataA.foo == "skip me")
//     p.cancel(); // cancel it when needed
//   else
//     return PromiseB();
// }).then(function(dataB){
//   console.log(dataB);
// }).catch(function (e) {
//   //Optimal solution will not cause this method to be invoked
// });
