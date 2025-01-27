export type Puppet = {
  id: string
  name: string
  //
  config: PuppetConfig
  //
  model: null | unknown
  memory: {
    short: {
      [key: string]: any
    }
    long: {
      [key: string]: any
    }
  }
  knowledge?: unknown
  interfaces: any | { name: string; client: unknown }[]
}

export type PuppetConfig = {
  id: string
  name: string
  //
  planner: {
    provider: 'core-planner-htn' | 'core-planner-sm' | 'core-planner-bt'
    config?: any
  }
  model: {
    provider: 'client-anthropic' | 'client-deepseek' | 'client-openai'
    config?: any
  }
  interfaces: {
    [index: string]: any
  }
  //
  bio: string[]
  //
  twitter?: {
    username: string
  }
}
