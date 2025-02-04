import type { TelegramClientPlugin } from '../client-telegram'

export type LoggerConfig = {
  clients: {
    sandbox: boolean
    console: boolean
    [key: string]: boolean
  }
  sandbox: {
    telegram: null | TelegramClientPlugin
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
