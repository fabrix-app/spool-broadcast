// tslint:disable:max-line-length
import { FabrixGeneric as Generic, FabrixModel } from '@fabrix/fabrix/dist/common'
import { get, isArray } from 'lodash'
import { Broadcast } from './Broadcast'
import { BroadcastCommand } from './BroadcastCommand'
import { mapSeries } from 'bluebird'
import { Entry } from './Entry'
import { regexdot } from '@fabrix/regexdot'

export function Story({ broadcaster, command, event, validator, annotations = null, docs = null }) {
  return function(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    console.log('experimental story', target, propertyKey)
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

  metadata(req) {
    return {
      req_user_uuid: req.user ? req.user.user_uuid : null,
      req_channel_uuid: req.channel ? req.channel.channel_uuid : null,
      req_application_uuid: req.application ? req.application.application_uuid : null,
      req_device_uuid: req.device ? req.device.device_uuid : null,
      req_session_uuid: req.channel_session ? req.channel_session.session_uuid : null,
    }
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

  public Sequelize() {
    if (!this.app.spools.sequelize) {
      throw new Error('Spool-sequelize is not loaded!')
    }
    return this.app.spools.sequelize._datastore
  }

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
  public before(command, validators, options: { transaction?: any} = {}): Promise<any> {

    const sagastart = process.hrtime()
    let hrstart = sagastart

    // const { pattern, keys } = regexdot(command.command_type)

    let useValidators = []
    Object.keys(validators).forEach(k => {
      const { pattern } = regexdot(k)
      const match = pattern.test('.' + command.command_type)
      if (match) {
        useValidators  = [...useValidators , validators[k]]
      }
    })

    // console.log('brk useValidators', useValidators)
    //
    // const validator = get(validators, command.command_type)

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
        return this.saga(_command, _options, useValidators)
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


  // /**
  //  * Validate the data value of a command/event
  //  * @param validator
  //  * @param obj
  //  * @param options
  //  */
  // validate(validator, obj, options) {
  //   return validator(
  //     isArray(obj.data)
  //       ? obj.data.map(d => d.toJSON ? d.toJSON() : d)
  //       : obj.data.toJSON
  //       ? obj.data.toJSON()
  //       : obj.data
  //   )
  //     .then(data => {
  //       return [obj, options]
  //     })
  // }

  /**
   *
   * @param command
   * @param endpoint
   * @param validator
   */
  processRequest(command, endpoint, validator): Promise<any> {
    //
    return Promise.resolve([command])
  }

  /**
   *
   * @param command
   * @param endpoint
   * @param validator
   */
  cancelRequest(command, endpoint, validator): Promise<any> {
    //
    return Promise.resolve([{status: 200}])
  }

  /**
   *
   * @param command
   * @param options
   * @param validator
   */
  saga(command, options, validator): Promise<any> {
    const sagas = new Map([])
    const ran = new Map()
    const cancelled = new Map()
    // this.app.log.warn('BRK todo prehooks', (command.metadata.prehooks || []).map(a => a.application_uuid))
    return Promise.resolve([command, options])
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
