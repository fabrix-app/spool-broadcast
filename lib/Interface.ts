import { BroadcastEvent } from './api/models'

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
  message?
}

export interface IProcessorParams {
  event: BroadcastEvent,
  options
}
