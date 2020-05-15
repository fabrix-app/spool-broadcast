import { BroadcastEvent } from './api/models'
import { BroadcastCommand } from './BroadcastCommand'
import { Broadcast } from './Broadcast'

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
  reloads?: string[],
  transaction?: any,
  useMaster?: any,
  includes?: string[]
}


export interface IProjectorParams {
  event: BroadcastEvent,
  options: {[key: string]: any},
  consistency?: string,
  message?,
  manager?: {[key: string]: any},
  broadcaster?: Broadcast
}

export interface IProcessorParams {
  event: BroadcastEvent,
  options: {[key: string]: any},
  consistency?: string,
  message?,
  manager?: {[key: string]: any},
  broadcaster?: Broadcast
}

export interface IDispatcherParams {
  event: BroadcastEvent,
  options: {[key: string]: any},
  consistency?: string,
  message?,
  manager?: {[key: string]: any},
  broadcaster?: Broadcast
}


export interface IHookInParams {
  command: BroadcastCommand,
  options: {[key: string]: any},
  lifecycle?: string,
  handler?: {[key: string]: any},
  broadcaster?: Broadcast
}

export interface IChannelParams {
  event: BroadcastEvent,
  options: {[key: string]: any},
  broker?: {[key: string]: any},
  broadcaster?: Broadcast
}

export interface IPipelineParams {
  command,
  pipeline,
  runner,
  req,
  body,
  options: string,
  broadcaster?: Broadcast
}
