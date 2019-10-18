import { GenericError } from '@fabrix/spool-errors/dist/errors'

export class ConfigError extends GenericError {}
ConfigError.prototype.name = 'BroadcastSpool Error'
