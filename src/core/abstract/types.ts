export type AbstractLogger = {
  send: (loggerMessage: AbstractLoggerMessage) => void
}

export type AbstractLoggerMessage = {
  type: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO' | 'LOG' | 'SANDBOX'
  origin: {
    type: 'SERVER' | 'PLAY' | 'PUPPET' | 'AGENT' | 'USER'
    id?: string
    name?: string
  }
  data: {
    message: string
    payload?: undefined | unknown
  }
}

export type AbstractAppPlugin = {
  identifier: string
  description: string
  key: string
  plugin: any
}

export type AbstractPlanner = {
  init: () => Promise<void>
  startPlanner: () => void
}
