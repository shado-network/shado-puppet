import type { PuppetInstance } from '../../core/puppet/types.ts'
import type { AbstractLoggerMessage } from '../../core/abstract/types.ts'

export type ShadoLoggerConfig = {
  showIcon: boolean
  showUser: boolean
}

export type ShadoLoggerMessage = AbstractLoggerMessage & {
  origin: {
    id?: string | PuppetInstance['config']['id']
    name?: string | PuppetInstance['config']['name']
  }
}
