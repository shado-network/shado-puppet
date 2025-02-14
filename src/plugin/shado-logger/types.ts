import { PuppetInstance } from '../../core/puppet/types.ts'

export type LoggerConfig = {
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

export type LoggerMessage = {
  type: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO' | 'LOG' | 'SANDBOX'
  source: 'SERVER' | 'PLAY' | 'PUPPET' | 'AGENT' | 'USER'
  message: string
  payload?: null | unknown
  //
  // TODO: Improve upon type. Unify or split fully.
  playId?: string
  puppetId?: PuppetInstance['config']['id']
  userId?: string
}
