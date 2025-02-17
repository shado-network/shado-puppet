// TODO: AbstractEvents?
import type { EventEmitter } from 'events'

export type PuppetInstance = {
  runtime: PuppetRuntime
  config: PuppetConfig
}

export type PuppetRuntime = {
  id: string
  //
  planner?: undefined | unknown
  model: undefined | unknown
  // TODO: AbstractEvents?
  events: undefined | EventEmitter
  clients: {
    [key: string]: any
  }
  //
  memory: {
    state?: {
      [key: string]: any
    }
    goals?: {
      [key: string]: (props: any) => boolean
    }
    [key: string]: any
  }
  knowledge?: unknown
}

export type PuppetConfig = {
  id: string
  name: string
  //
  planner: {
    provider: 'shado-planner-htn' | 'shado-planner-sm' | 'shado-planner-bt'
    config: {
      goals: {
        [key: string]: (props: any) => boolean
      }
      [key: string]: any
    }
  }
  model: {
    provider: 'adapter-anthropic' | 'adapter-deepseek' | 'adapter-openai'
    config?: { [key: string]: any }
  }
  clients: {
    identifier: string
    config: { [key: string]: any }
    secrets: { [key: string]: any }
    [key: string]: any
  }[]

  //
  bio: string[]
}
