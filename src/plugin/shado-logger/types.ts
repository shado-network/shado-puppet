export type LoggerConfig = {
  clients: {
    sandbox: boolean
    console: boolean
    [key: string]: boolean
  }
  sandbox: {
    // TODO: Update to the proper type from the plugin.
    telegram: null | any
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
  playId?: string
  puppetId?: string
  userId?: string
}
