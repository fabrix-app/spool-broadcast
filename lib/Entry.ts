import { FabrixGeneric as Generic, FabrixModel } from '@fabrix/fabrix/dist/common'
import { isEmpty, isArray, isObject } from 'lodash'
import { GenericError } from '@fabrix/spool-errors/dist/errors'
// import { ModelError } from '../../../errors'

export function Point({ receives = null, expects = null, docs = null }) {
  return function(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    console.log('experimental point', target, propertyKey)
    // var timeout:any;
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
 * @module Entry
 * @description Entry
 */
export class Entry extends Generic {

  get name() {
    return this.constructor.name
  }

  query(model, method, query) {
    if (!this.app.models[model]) {
      // throw new ModelError('E_BAD_REQUEST_MODEL', 'Model not found in app')
      throw new Error('E_BAD_REQUEST_MODEL')
    }
    if (!this.app.models[model][method]) {
      // throw new ModelError('E_BAD_REQUEST_MODEL_METHOD', 'Model method not found in app')
      throw new Error('E_BAD_REQUEST_MODEL_METHOD')
    }

    return this.app.models[model][method](query)
      .then(_data => {
        if (_data && _data.rows || _data && isArray(_data)) {
          _data.forEach(d => {
            d.isReloaded = true
            d.isNewRecord = false
          })
        }
        else {
          _data.isReloaded = true
          _data.isNewRecord = false
          return _data
        }
      })
  }

  /**
   * Turn string based query into save operators
   * @param req
   * @param query
   * @param options
   */
  prepQuery(req, { query }, options) {
  //   [Op.and]: {a: 5}           // AND (a = 5)
  //   [Op.or]: [{a: 5}, {a: 6}]  // (a = 5 OR a = 6)
  //   [Op.gt]: 6,                // > 6
  //   [Op.gte]: 6,               // >= 6
  //   [Op.lt]: 10,               // < 10
  //   [Op.lte]: 10,              // <= 10
  //   [Op.ne]: 20,               // != 20
  //   [Op.eq]: 3,                // = 3
  //   [Op.not]: true,            // IS NOT TRUE
  //   [Op.between]: [6, 10],     // BETWEEN 6 AND 10
  //   [Op.notBetween]: [11, 15], // NOT BETWEEN 11 AND 15
  //   [Op.in]: [1, 2],           // IN [1, 2]
  //   [Op.notIn]: [1, 2],        // NOT IN [1, 2]
  //   [Op.like]: '%hat',         // LIKE '%hat'
  //   [Op.notLike]: '%hat'       // NOT LIKE '%hat'
  //   [Op.iLike]: '%hat'         // ILIKE '%hat' (case insensitive) (PG only)
  //   [Op.notILike]: '%hat'      // NOT ILIKE '%hat'  (PG only)
  //   [Op.startsWith]: 'hat'     // LIKE 'hat%'
  //   [Op.endsWith]: 'hat'       // LIKE '%hat'
  //   [Op.substring]: 'hat'      // LIKE '%hat%'
  //   [Op.regexp]: '^[h|a|t]'    // REGEXP/~ '^[h|a|t]' (MySQL/PG only)
  //   [Op.notRegexp]: '^[h|a|t]' // NOT REGEXP/!~ '^[h|a|t]' (MySQL/PG only)
  //   [Op.iRegexp]: '^[h|a|t]'    // ~* '^[h|a|t]' (PG only)
  //   [Op.notIRegexp]: '^[h|a|t]' // !~* '^[h|a|t]' (PG only)
  //   [Op.like]: { [Op.any]: ['cat', 'hat']}
  // // LIKE ANY ARRAY['cat', 'hat'] - also works for iLike and notLike
  //   [Op.overlap]: [1, 2]       // && [1, 2] (PG array overlap operator)
  //   [Op.contains]: [1, 2]      // @> [1, 2] (PG array contains operator)
  //   [Op.contained]: [1, 2]     // <@ [1, 2] (PG array contained by operator)
  //   [Op.any]: [2,3]            // ANY ARRAY[2, 3]::INTEGER (PG only)
  //
  //   [Op.col]
    const mapShortToLong = {
      '$and': this.app.spools.sequelize._datastore.Op.and,
      '$or': this.app.spools.sequelize._datastore.Op.or,
      '>': this.app.spools.sequelize._datastore.Op.gt,
      '$gt': this.app.spools.sequelize._datastore.Op.gt,
      '>=': this.app.spools.sequelize._datastore.Op.gte,
      '$gte': this.app.spools.sequelize._datastore.Op.gt,
      '<': this.app.spools.sequelize._datastore.Op.lt,
      '$lt': this.app.spools.sequelize._datastore.Op.gt,
      '<=': this.app.spools.sequelize._datastore.Op.lte,
      '$lte': this.app.spools.sequelize._datastore.Op.gt,
      '$ne': this.app.spools.sequelize._datastore.Op.ne,
      '$eq': this.app.spools.sequelize._datastore.Op.eq,
      '$not': this.app.spools.sequelize._datastore.Op.not,
      '$between': this.app.spools.sequelize._datastore.Op.between,
      '$notBetween': this.app.spools.sequelize._datastore.Op.$notBetween,
      '$in': this.app.spools.sequelize._datastore.Op.in,
      '$notIn': this.app.spools.sequelize._datastore.Op.notIn,
      '$like': this.app.spools.sequelize._datastore.Op.like,
      '$notLike': this.app.spools.sequelize._datastore.Op.notLike,
      '$iLike': this.app.spools.sequelize._datastore.Op.iLike,
      '$notILike': this.app.spools.sequelize._datastore.Op.notIlike,
      '$startsWith': this.app.spools.sequelize._datastore.Op.startsWith,
      '$endsWith': this.app.spools.sequelize._datastore.Op.endsWith,
      '$reqexp': this.app.spools.sequelize._datastore.Op.regex,
      '$notRegexp': this.app.spools.sequelize._datastore.Op.notRegexp,
      '$iRegex': this.app.spools.sequelize._datastore.Op.iRegexp,
      '$notIRegexp': this.app.spools.sequelize._datastore.Op.notIRegexp,
      '$overlap': this.app.spools.sequelize._datastore.Op.overlap,
      '$contains': this.app.spools.sequelize._datastore.Op.contains,
      '$contained': this.app.spools.sequelize._datastore.Op.contained,
      '$any': this.app.spools.sequelize._datastore.Op.any,
      '$col': this.app.spools.sequelize._datastore.Op.col,
    }

    function refitKeys(o: any) {
      let key, destKey, ix, value

      for (key in o) {
        if (typeof key === 'string' && o.hasOwnProperty(key)) {
          // Get the destination key
          destKey = mapShortToLong[key] || key

          // Get the value
          value = o[key]

          // If this is an object, recurse
          if (!isArray(value) && isObject(value)) {
            value = refitKeys(value)
          }
          else if (isArray(value)) {
            //
          }
          else {
            //
          }

          // Set it on the result using the destination key
          o[destKey] = value
        }
      }
      return o
    }

    query = query || {}
    if (query.where) {
      query.where = refitKeys(query.where)
    }

    return query
  }

  /**
   * Model Error
   * @param params
   */
  // modelError(...params: string[]): ModelError {
  modelError(...params: string[]) {
    // return new ModelError(params[0], params[1] || params[0])
    return new GenericError(...params)
  }

  /**********************************************************
   * Utils
   **********************************************************/
  /**
   * Boolean if a Row Exists
   * @param req
   * @param params
   * @param options
   */
  rowExists(req, { params }, options: {[key: string]: any} = {}): Promise<boolean> {
    const { resource, ...p } = params
    const model = resource && this.app.models[resource] ? this.app.models[resource].instance : null
    let err, query = []

    // Convert p to query array
    Object.keys(p || {}).forEach(param => {
      query.push(`${ param } = $${param}`)
    })

    if (!resource) {
      // err = new ModelError('E_BAD_REQUEST_RESOURCE_NOT_SET', `Resource not set in params.resource`)
      err = new Error('E_BAD_REQUEST_RESOURCE_NOT_SET')
      return Promise.reject(err)
    }
    if (!model) {
      // err = new ModelError('E_BAD_REQUEST_RESOURCE_NOT_VALID', `Resource ${resource} not valid`)
      err = new Error('E_BAD_REQUEST_RESOURCE_NOT_VALID')
      return Promise.reject(err)
    }

    if (isEmpty(p) || query.length === 0) {
      // err = new ModelError('E_BAD_REQUEST_RESOURCE_QUERY_INVALID', `Resource query ${JSON.stringify(p)} not valid`)
      err = new Error('E_BAD_REQUEST_RESOURCE_QUERY_INVALID')
      return Promise.reject(err)
    }

    return model.sequelize
      .query(`SELECT exists(SELECT 1 FROM ${model.getTableName()} WHERE ${query.join(' AND ')} )`, {
        bind: p,
        model: model,
        mapToModel: false, // pass true here if you have any mapped fields
        transaction: options.transaction,
        useMaster: options.useMaster
      })
      .then(([row]) => {
        // console.log('brk exists 1', row, options.reject)
        // Each record will now be an instance of Model
        if (!row || row.get('exists') === false) {
          return options.reject === false
            ? false
            : Promise.reject(false)
        }
        else {
          return true
        }
      })
      .catch(_err => {
        // console.log('brk exists 1.1', options.reject)
        this.app.log.error(this.name, '.rowExists', _err)
        return Promise.reject(_err)
      })
    //
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
  entries(name): Entry {
    if (!this.app.spools.broadcast) {
      throw new Error('Spool-broadcast is not loaded!')
    }
    return this.app.spools.broadcast.entries(name)
  }
  /**
   * Create transaction
   * @param func
   * @param req
   * @param body
   * @param options
   */
  public transaction (func, req, body, options): Promise<any> {
    if (!this.app.spools.broadcast) {
      throw new Error('Spool-broadcast is not loaded!')
    }
    return this.app.spools.broadcast.transaction(func, req, body, options)
  }

  /**
   * Return the Sequelize used in the entry models
   * @constructor
   */
  public Sequelize() {
    if (!this.app.spools.sequelize) {
      throw new Error('Spool-sequelize is not loaded!')
    }
    return this.app.spools.sequelize._datastore
  }

  /**
   * Combine two model objects
   * @param src
   * @param tgt
   * @param tgtModel
   * @param tgtOptions
   * @param srcModel
   * @param srcOpts
   */
  public combine({
    src = {},
    tgt = {},
    tgtModel,
    tgtOpts = {},
    srcModel,
    srcOpts
  }: {
    src: any,
    tgt: any,
    tgtModel: FabrixModel,
    tgtOpts: {[key: string]: any},
    srcModel?: FabrixModel,
    srcOpts?: {[key: string]: any}
  }): FabrixModel {

    // If both of these values are empty then we should expect to return null
    if (isEmpty(src) && isEmpty(tgt)) {
      return null
    }

    // The target Model should be defined so we know what to stage
    if (!tgtModel) {
      throw new Error('Target Model is required!')
    }

    if (
      tgtModel
      && (!tgtModel.constructor && !tgtModel.constructor.name)
      && !this.app.models[tgtModel.constructor.name]
      && !tgtModel.stage
    ) {
      throw new Error('Not a valid model as combine target model!')
    }

    if (
      srcModel
      && (!srcModel.constructor && !srcModel.constructor.name)
      && !this.app.models[srcModel.constructor.name]
      && !srcModel.stage
    ) {
      throw new Error('Not a valid model as combine source model!')
    }

    src = src.toJSON ? src.toJSON() : src
    tgt = tgt.toJSON ? tgt.toJSON() : tgt

    return tgtModel.stage(Object.assign({}, src, tgt), tgtOpts)
  }
}
