// tslint:disable:max-line-length
/**
 * Spool Configuration
 *
 * @see {@link https://fabrix.app/doc/spool/config
 */
export const spool = {
  type: 'misc',
  /**
   * API and config resources provided by this Spool.
   */
  provides: {
    resources: ['controllers', 'models', 'services', 'events', 'crons', 'emails'],
    api: {
      controllers: ['BroadcastController'],
      services: [],
      models: ['Broadcast'],
      events: [],
      crons: [],
      tasks: []
    },
    config: ['broadcast']
  },
  /**
   * Configure the lifecycle of this pack; that is, how it boots up, and which
   * order it loads relative to other spools.
   */
  lifecycle: {
    configure: {
      /**
       * List of events that must be fired before the configure lifecycle
       * method is invoked on this Spool
       */
      listen: [
        'spool:sequelize:configured'
      ],

      /**
       * List of events emitted by the configure lifecycle method
       */
      emit: []
    },
    initialize: {
      listen: [
        'spool:sequelize:initialized'
      ],
      emit: []
    }
  }
}

