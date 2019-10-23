import { Broadcast } from './Broadcast'
import { FabrixApp } from '@fabrix/fabrix'
import { FabrixGeneric as Generic } from '@fabrix/fabrix/dist/common'
import { isEmpty } from 'lodash'
import EventEmitter from 'events'


export class PipelineEmitter extends EventEmitter {
  public command: string
  public pipeline: any
  public runner: any

  constructor(public app: FabrixApp, command, pipeline, runner, req, body, options) {
    super()
    this.app = app
    this.command = command
    this.pipeline = pipeline
    this.runner = runner

    this.on(`${this.command}.progress`, this.progress)
    this.on(`${this.command}.failure`, this.failure)
    this.on(`${this.command}.error`, this.error)
    this.on(`${this.command}.complete`, this.complete)

    this.run(pipeline, runner, req, body, options)
  }

  run(pipeline, runner, req, body, options) {

    const pipes = Array.from(pipeline.always)
    const runners = Array.from(runner.always)
    let breakException

    // Build the progress meter
    let total = pipes.length

    // Emit start of progress
    this.emit(`${this.command}.progress`, `${this.command}`, 0, total)

    // Map the pipeline
    this.app.spools.sequelize._datastore.Promise.mapSeries(pipes, (pipe, i) => {

      if (breakException) {
        return Promise.reject(breakException)
      }

      // the entrypoint/pipeline name
      const name = pipe[0]
      // The function that's mapped to this
      const func = pipe[1]

      // The runner for the pipe
      const run = runners[i]
      // The runners config
      const { before, after, merge, zip, failOnError } = run[1]

      this.app.log.silly(`Pipeline ${this.command}: ${name} config`, before, after, merge, zip, failOnError)

      let _req = req,
        _body = body,
        _options = options

      // Transform before request
      if (before && typeof before === 'function') {
        try {
          [_req, _body, _options] = before(_req, _body, _options)
        }
        catch (e) {
          this.app.log.error(`before ${this.command}.error`, e)
          this.emit(`${this.command}.error`, e)
          if (failOnError) {
            breakException = e
            return Promise.reject(e)
          }
        }
      }

      // Run the function
      return func(_req, _body, _options)
        .then(([__body, __options]) => {
          // Transform after request
          if (after && typeof after === 'function') {
            try {
              [_req, __body, __options] = after(_req, __body, __options)
            }
            catch (e) {
              this.app.log.error(`after ${this.command}.error`, e)
              this.emit(`${this.command}.error`, e)
              if (failOnError) {
                breakException = e
                return Promise.reject(e)
              }
            }
          }

          // Emit progress
          this.emit(`${this.command}.progress`, `${this.command}.${name}`, i + 1, total)
          // Emit the success with of the pipe with the transformed body
          this.emit(`${this.command}.success`, _req, __body, __options)

          // TODO merge rules
          if (zip && typeof zip !== 'function' && !isEmpty(zip)) {
            const keys = Object.keys(zip)

            keys.forEach((key, _i) => {
              const _key = keys[_i] || key
              body[key] = __body[_key]
            })
          }
          else if (zip && typeof zip === 'function') {
            zip(_body, __body)
          }
          else if (merge) {
            body = __body
            options = __options
          }
          else {
            // do nothing
          }

          // Return the original request, the possibly modified body, and possibly modified options
          return [_req, __body, __options]
        })
        .catch((err) => {
          // Emit the error
          this.app.log.error(`${this.command}.error`, err)
          this.emit(`${this.command}.error`, err)

          // If the runner says to fail completely on error
          if (failOnError) {
            breakException = err
            return Promise.reject(err)
          }
          // Otherwise, return the previous body can keep going
          else {
            return Promise.resolve([_req, _body, _options])
          }
        })
    })
      .then((results) => {
        this.emit(`${this.command}.complete`, req, body, options)
        return [req, body, options]
      })
      .catch(err => {
        // Emit total failure
        this.app.log.error(`${this.command}.failure`, err)
        this.emit(`${this.command}.failure`, err)
        return [req, body, options]
      })
  }

  /**
   * Emit Progress
   */
  progress(name: string, index: number, total: number): void {
    this.emit('progress', name, index, total)
  }

  /**
   * Emit Error
   * @param args
   */
  error(...args): void {
    this.emit('error', ...args)
  }
  /**
   * Emit Total Failure
   * @param args
   */
  failure(...args): void {
    this.emit('failure', ...args)
  }

  /**
   * Emit Progress Success
   * @param args
   */
  success(...args): void {
    this.emit('success', ...args)
  }
  /**
   * Emit Total completed
   * @param args
   */
  complete(...args): void {
    this.emit('complete', ...args)
  }
}



export class Pipe {
  public req
  public command: string
  public body
  public options
  public isAcknowledged

  constructor(public app: FabrixApp, command, req, body, options) {
    this.app = app
    this.command = command
    this.req = req
    this.body = body
    this.options = options
    this.isAcknowledged = false
  }

  get name() {
    return this.constructor.name
  }

  // async run (): Promise<any> {
  //   throw new Error('Subclasses must override Project.run')
  // }

  // /**
  //  * Acknowledge the event
  //  */
  // async ack(): Promise<any> {
  //   if (!this.isAcknowledged) {
  //     this.isAcknowledged = true
  //     return Promise.resolve([this.event, this.options])
  //   }
  //   else {
  //     this.app.log.warn(`${this.name} attempting to ack a message that already responded`)
  //     return Promise.resolve([this.event, this.options])
  //   }
  // }
  //
  // /**
  //  * Don't Acknowledge the event
  //  */
  // async nack(): Promise<any> {
  //   if (!this.isAcknowledged) {
  //     this.isAcknowledged = true
  //     return Promise.reject([this.event, this.options])
  //   }
  //   else {
  //     this.app.log.warn(`${this.name} attempting to nack a message that already responded`)
  //     return Promise.reject([this.event, this.options])
  //   }
  // }
  //
  // /**
  //  * Reject the event
  //  */
  // async reject(): Promise<any> {
  //   if (!this.isAcknowledged) {
  //     this.isAcknowledged = true
  //     return Promise.reject([this.event, this.options])
  //   }
  //   else {
  //     this.app.log.warn(`${this.name} attempting to reject a message that already responded`)
  //     return Promise.reject([this.event, this.options])
  //   }
  // }
}


/**
 * @module Pipeline
 * @description Pipeline
 */
export class Pipeline extends Generic {


  private _broadcasters: Map<string, Broadcast> = new Map()
  private _protectedMethods = ['getBroadcaster', 'addBroadcaster', 'removeBroadcaster', 'hasBroadcaster']

  constructor(app: FabrixApp) {
    super(app)
    const broadcasters = Object.keys(
      this.app.config.get(`broadcast.pipelines.${this.name}.broadcasters`)
      || {}
    )

    // this._broadcasters =
    broadcasters.forEach((k) => {
      if (k && this.app.broadcasts[k]) {
        this.addBroadcaster(this.app.broadcasts[k])
      }
      else {
        this.app.log.error(`Attempting to register broadcast ${ k } on pipeline ${this.name}, but ${k} was not found in api/broadcasts`)
      }
    })
  }

  get name() {
    return this.constructor.name
  }

  getBroadcaster (name) {
    return this._broadcasters.get(name)
  }
  /**
   * Add a Broadcaster
   * @param broadcaster
   */
  addBroadcaster (broadcaster: Broadcast) {
    this._broadcasters.set(broadcaster.name, broadcaster)
    return this.broadcasters
  }

  /**
   * Remove a Broadcaster
   * @param broadcaster
   */
  removeBroadcaster (broadcaster: Broadcast) {
    this._broadcasters.delete(broadcaster.name)
    return this.broadcasters
  }

  hasBroadcaster (broadcaster: Broadcast) {
    return this.broadcasters.has(broadcaster.name)
  }

  get broadcasters () {
    return this._broadcasters
  }

  set broadcasters (broadcasters) {
    throw new Error(`Can not map broadcasters through this method`)
  }

}
