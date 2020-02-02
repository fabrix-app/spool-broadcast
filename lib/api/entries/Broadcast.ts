import { Entry } from '../../Entry'
import { GenericError } from '@fabrix/spool-errors/dist/errors'

/**
 * @module Broadcast
 * @description Root Broadcast Entry
 */
export class Broadcast extends Entry {
  /**
   * Find All Broadcast Events (Root List Query)
   * @param req
   * @param params
   * @param query
   * @param options
   */
  findAll(req, { params, query}, options) {
    query = this.prepQuery(req, { query }, options)

    const where = query.where
    const limit = Math.max(0, query.limit || 10)
    const offset = Math.max(0, query.offset || 0)
    const sort = query.sort || [['created_at', 'desc']]
    let include = [...(options.include || [])]

    return this.app.models.BroadcastEvent.findAndCountAll({
      ...query,
      ...options,
      include: include,
      limit: limit,
      offset: offset,
      order: sort
    })
      .then((results) => {
        return [{
          list: this.app.models.BroadcastEvent,
          data: results.rows,
          total: results.count,
          limit: limit,
          offset: offset,
          where: where,
          sort: sort,
        }, options]
      })
  }
  /**
   * Get an Event's parent Event
   * @param req
   * @param body
   * @param options
   */
  parent(req, body, options) {
    return this.app.models.BroadcastEvent.findOne({
      where: { event_uuid: body.params.event_uuid },
      attributes: ['event_uuid', 'causation_uuid', 'causation_hierarchy_level'],
      transaction: options.transcation || null,
      useMaster: options.useMaster || null
    })
      .then((_event) => {
        if (!_event && options.reject !== false) {
          throw new GenericError('E_NOT_FOUND_EVENT', `Event ${body.params.event_uuid} not found`)
        }
        else if (!_event) {
          return _event
        }
        return _event.getParent({ transaction: options.transaction || null, useMaster: options.useMaster })
      })
  }

  /**
   * List an Event's ancestor Events
   * @param req
   * @param body
   * @param options
   */
  // TODO count ancestors
  ancestors(req, body, options) {
    const limit = Math.max(0, body.query.limit || 10)
    const offset = Math.max(0, body.query.offset || 0)
    const where = body.query.where

    return this.app.models.BroadcastEvent.findOne({
      where: {
        ...where,
        event_uuid: body.params.event_uuid
      },
      attributes: ['event_uuid', 'causation_uuid', 'causation_hierarchy_level'],
      include: [{ model: this.app.models.BroadcastEvent.instance, as: 'ancestors' }],
      order: [[{ model: this.app.models.BroadcastEvent.instance, as: 'ancestors' }, 'causation_hierarchy_level']],
      transaction: options.transcation || null,
      useMaster: options.useMaster || null
    })
      .then((_event) => {
        if (!_event && options.reject !== false) {
          throw new GenericError(
            'E_NOT_FOUND_EVENT',
            `Event ${body.params.event_uuid} not found`
          )
        }
        else if (!_event) {
          return [_event, options]
        }
        return [{
          list: this.app.models.BroadcastEvent,
          data: _event.ancestors,
          total: _event.count,
          limit: limit,
          offset: offset,
          where: where
        }, options]
      })
  }

  /**
   * List an Event's children Events
   * @param req
   * @param body
   * @param options
   */
  children(req, body, options) {
    const limit = Math.max(0, body.query.limit || 10)
    const offset = Math.max(0, body.query.offset || 0)
    const where = body.query.where

    return this.app.models.BroadcastEvent.findAndCountAll({
      ...options,
      where: {
        ...where,
        causation_uuid: body.params.event_uuid
      },
      limit: limit,
      offset: offset,
      transaction: options.transcation || null,
      useMaster: options.useMaster || null
    })
      .then((results) => {
        return [{
          list: this.app.models.BroadcastEvent,
          data: results.rows,
          total: results.count,
          limit: limit,
          offset: offset,
          where: where
        }, options]
      })
  }

  /**
   * List an Event's descendant Events
   * @param req
   * @param body
   * @param options
   */
  // TODO count descendants
  descendants(req, { query, params }, options) {
    query = this.prepQuery(req, { query }, options)

    const limit = Math.max(0, query.limit || 10)
    const offset = Math.max(0, query.offset || 0)
    const where = query.where

    return this.app.models.BroadcastEvent.findOne({
      where: {
        ...where,
        event_uuid: params.event_uuid
      },
      attributes: ['event_uuid', 'causation_uuid', 'causation_hierarchy_level'],
      include: [{
        model: this.app.models.BroadcastEvent.instance,
        as: 'descendents',
        hierarchy: true
      }],
      transaction: options.transcation || null,
      useMaster: options.useMaster || null
    })
      .then((_event) => {
        if (!_event && options.reject !== false) {
          throw new GenericError(
            'E_NOT_FOUND_EVENT',
            `Event ${params.event_uuid} not found`
          )
        }
        else if (!_event) {
          return [_event, options]
        }

        return [{
          list: this.app.models.BroadcastEvent,
          data: _event.children,
          total: _event.count,
          limit: limit,
          offset: offset,
          where: where
        }, options]
      })
  }

  /**
   * List an Event's sibling Events
   * @param req
   * @param body
   * @param options
   */
  siblings(req, { query, params }, options) {
    query = this.prepQuery(req, { query }, options)

    const limit = Math.max(0, query.limit || 10)
    const offset = Math.max(0, query.offset || 0)
    const where = query.where

    return this.app.models.BroadcastEvent.findOne({
      where: {
        // ...query.where,
        event_uuid: params.event_uuid
      },
      attributes: ['event_uuid', 'causation_uuid', 'causation_hierarchy_level'],
      transaction: options.transcation || null,
      useMaster: options.useMaster || null
    })
      .then((_event) => {
        if (!_event && options.reject !== false) {
          throw new GenericError(
            'E_NOT_FOUND_EVENT',
            `Event ${params.event_uuid} not found`
          )
        }
        else if (!_event) {
          return _event
        }
        return this.app.models.BroadcastEvent.findAndCountAll({
          where: {
            ...where,
            // They share the same parent
            causation_uuid: _event.causation_uuid,
            // But is not the same event as the requested one.
            event_uuid: {
              [this.app.spools.sequelize._datastore.Op.ne]: params.event_uuid
            }
          }
        })
      })
      .then((results) => {

        if (!results) {
          return [results, options]
        }

        return [{
          list: this.app.models.BroadcastEvent,
          data: results.rows,
          total: results.count,
          limit: limit,
          offset: offset,
          where: where
        }, options]
      })
  }
}
