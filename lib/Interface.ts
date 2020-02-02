import { BroadcastEvent } from './api/models'
import { BroadcastCommand } from './BroadcastCommand'

export interface BroadcastAction {
  action: string | boolean
}
export interface BroadcastOptions {
  [key: string]: any
}

export type IBroadcastTuple = [BroadcastEvent | BroadcastAction, BroadcastAction]


export interface IBroadcastModelResolve {
  req?: any,
  reject?: boolean,
  reload?: boolean,
  transaction?: any,
  useMaster?: any,
  includes?: string[]
}


export interface IProjectorParams {
  event: BroadcastEvent,
  options,
  consistency?,
  message?,
  manager?
}

export interface IProcessorParams {
  event: BroadcastEvent,
  options,
  consistency?,
  message?,
  manager?
}


export interface IHookInParams {
  command: BroadcastCommand,
  options,
  lifecycle?: string,
  handler?
}

export interface IChannelParams {
  event: BroadcastEvent,
  options,
  broker?
}

export interface IPipelineParams {
  command,
  pipeline,
  runner,
  req,
  body,
  options
}
