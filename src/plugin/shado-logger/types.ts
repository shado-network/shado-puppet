import { AbstractLoggerMessage } from '../../core/abstract/types.ts'
import { PuppetInstance } from '../../core/puppet/types.ts'

export type ShadoLoggerConfig = {
  clients: {
    sandbox: boolean
    console: boolean
    [key: string]: boolean
  }
  sandboxClients: {
    // TODO: Update to the proper type from the plugin.
    telegram: undefined | any
    [key: string]: any
  }
  //
  [key: string]: any
}

export type ShadoLoggerMessage = AbstractLoggerMessage & {
  origin: {
    id?: string | PuppetInstance['config']['id']
    name?: string | PuppetInstance['config']['name']
  }
}
