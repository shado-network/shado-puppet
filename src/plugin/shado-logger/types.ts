import type { TelegramClientPlugin } from '../client-telegram'

export type LoggerConfig = {
  interfaces: {
    [key: string]: boolean
  }
  sandbox: {
    telegramClient: null | TelegramClientPlugin
    [key: string]: any
  }
  //
  [key: string]: any
}

export type LoggerMessage = {
  type: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO' | 'LOG' | 'SANDBOX'
  source: 'SERVER' | 'PLAY' | 'PUPPET' | 'AGENT' | 'USER'
  playId?: string
  puppetId?: string
  userId?: string
  message: string
  payload?: null | unknown
}
