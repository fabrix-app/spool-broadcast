import { FabrixModel as Model} from '@fabrix/fabrix/dist/common'
import { isArray } from 'lodash'
// import Serializer from 'sequelize-to-json'
/**
 * @module BroadcastObjectModel
 * @description Item Channel Model n:m
 */
export class BroadcastObjectModel extends Model {

}

export interface BroadcastObjectModel {
  isReloaded: boolean
  isStaged: boolean
  isSynced: boolean
  changes(options?): any
  toBinary(options?): any
  toPlain(options?): any
  // primaryKeys(options?): string[]
}

BroadcastObjectModel.prototype.isReloaded = false
BroadcastObjectModel.prototype.isStaged = false
BroadcastObjectModel.prototype.isSynced = false
BroadcastObjectModel.prototype.changes = function (options) {
  return this.changed(options)
}
// BroadcastObjectModel.prototype.primaryKeys = function (options) {
//   console.log('BRK primary keys 1', this._modelOptions)
//   return []
// }

BroadcastObjectModel.prototype.toBinary = function(options = {}) {

  const model = this.app.models[this.constructor.name]
  const resolver = model.resolver
  const resp = this.get({plain: true})

  // console.log('brk toBinary', resolver.toBinaryData)

  // Object.keys(resp).forEach(k => {
  //   if (resp.hasOwnProperty(k) && resp[k]) {
  //     if (isArray(resp[k])) {
  //       resp[k] = resp[k].map(_c => {
  //         if (typeof _c.toBinary === 'function') {
  //           _c = _c.toBinary(options)
  //         }
  //         return _c
  //       })
  //     }
  //     else if (typeof resp[k].toBinary === 'function') {
  //       resp[k] = resp[k].toBinary(options)
  //     }
  //   }
  // })

  Object.keys(resp).forEach(k => {
    if (resp.hasOwnProperty(k) && resp[k]) {
      if (isArray(resp[k])) {
        resp[k] = resp[k].map(_c => {
          if (_c && _c.get && typeof _c.get === 'function') {
            _c = _c.get({plain: true})
          }
          return _c
        })
      }
      else if (typeof resp[k].get === 'function') {
        resp[k] = resp[k].get({plain: true})
      }
    }
  })


  return resolver.toBinaryData(resp, model)
}

BroadcastObjectModel.prototype.toPlain = function(options = {}) {

  const model = this.app.models[this.constructor.name]
  const resolver = model.resolver
  const resp = this.get({plain: true})

  Object.keys(resp).forEach(k => {
    if (resp.hasOwnProperty(k) && resp[k]) {
      if (isArray(resp[k])) {
        resp[k] = resp[k].map(_c => {
          if (_c && _c.toPlain && typeof _c.toPlain === 'function') {
            _c = _c.toPlain({plain: true})
          }
          return _c
        })
      }
      else if (typeof resp[k].toPlain === 'function') {
        resp[k] = resp[k].toPlain({plain: true})
      }
    }
  })

  return resp
}
