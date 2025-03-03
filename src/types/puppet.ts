import type { AbstractLogger, AbstractSandbox } from '@/types/abstract'

export type PuppetConfig = {
  id: string
  name: string
  //
  nicknames?: string[]
  bio?: string[]
}

export type PuppetContext = {
  config: {
    sandboxMode: boolean
    [key: string]: any
  }
  utils: {
    logger?: undefined | AbstractLogger
    sandbox?: undefined | AbstractSandbox
  }
}
