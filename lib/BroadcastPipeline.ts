import { FabrixApp } from '@fabrix/fabrix'
import EventEmitter from 'events'
import { isEmpty, get, set } from 'lodash'
import { BroadcastEntity } from './BroadcastEntity'

export function Pipeline({
  expects_input = null,
  expects_response = null,
  docs = null
}) {
  return function(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    // console.log('experimental point', target, propertyKey)
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

export class PipelineEmitter extends EventEmitter {
  public command: string
  public pipeline: any
  public runner: any

  constructor(
    public app: FabrixApp,
    {
      command,
      broadcaster: Broadcaster,
      pipeline,
      runner,
      req,
      body,
      options = {}
    }: {
      command,
      broadcaster,
      pipeline,
      runner: {[key: string]: any},
      req: {[key: string]: any},
      body: any,
      options: {[key: string]: any}
    }
  ) {
    super()
    this.app = app
    this.command = command
    this.pipeline = pipeline
    this.runner = runner

    // Combine Options
    if (runner && runner.options) {
      options = Object.assign({}, options, runner.options)
    }

    this.on(`${this.command}.progress`, this.progress)
    this.on(`${this.command}.failure`, this.failure)
    this.on(`${this.command}.error`, this.error)
    this.on(`${this.command}.complete`, this.complete)

    this.run(pipeline, runner, req, body, options)
  }

  run(pipeline, runner, req, body, options) {

    // Get the Pipes
    const pipes = Array.from(pipeline.always)
    // Get the Runners
    const runners = Array.from(runner.always)
    // Declare a variable for a break exception
    let breakException

    // Build the progress meter
    let total = pipes.length

    // Emit start of progress
    this.emit(`${this.command}.progress`, `${this.command}`, 0, total)

    // Map the pipeline
    this.app.broadcastSeries(pipes, (pipe, i) => {

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
      const { before, after, merge, zip, fail_on_error } = run[1]

      this.app.log.silly(`Pipeline ${this.command}: ${name} config`, before, after, merge, zip, fail_on_error)

      // Copy the current req, body, options
      let _req = req,
        _body = body,
        _options = options

      if (run[1].if && typeof run[1].if === 'function') {
        let skip = true
        try {
          skip = !run[1].if(_req, _body, _options)
        }
        catch (e) {
          this.app.log.error(`if ${this.command}.error`, e)
        }
        // If the function returns true, then we skip this process
        if (skip) {
          this.emit(`${this.command}.skipped`, `${this.command}.${name}`, i + 1, total)
          return [_req, _body, _options]
        }
      }

      // Transform before request
      if (before && typeof before === 'function') {
        try {
          [_req, _body, _options] = before(_req, _body, _options)
        }
        catch (e) {
          this.app.log.error(`before ${this.command}.error`, e)
          this.emit(`${this.command}.error`, e)
          if (fail_on_error) {
            breakException = e
            return Promise.reject(e)
          }
        }
      }

      // Attach this pipeline to options to it can be emitted from during the run
      _options.pipeline = this

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
              if (fail_on_error) {
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
          // If we have a zip object, merge key value from right to left
          if (
            zip
            && typeof zip !== 'function'
            && !isEmpty(zip)
          ) {

            const keys = Object.keys(zip)

            keys.forEach((key, _i) => {
              // const _key = keys[_i] || key
              const _key = get(keys, _i, key)
              // body[key] = __body[_key]
              set(body, key, __body[_key])
            })
          }
          // If we have a zip function
          else if (
            zip
            && typeof zip === 'function'
          ) {
            zip(_body, __body)
          }
          // Otherwise, simply replace with merge
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
          if (fail_on_error) {
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
  progress(name: string, index: number, total: number, message?: any): void {
    this.emit('progress', name, index, total, message)
  }

  /**
   * Emit Progress
   */
  subprogress(name: string, index: number, total: number, message?: any): void {
    this.emit('subprogress', name, index, total, message)
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



export class BroadcastPipe {
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
}


/**
 * @module Pipeline
 * @description Pipeline
 */
export class BroadcastPipeline extends BroadcastEntity {
  constructor(app: FabrixApp) {
    super(app, 'pipelines')
  }
}
