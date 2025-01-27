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
    provider: 'shado-planner-htn' | 'shado-planner-sm' | 'shado-planner-bt'
    config?: any
  }
  model: {
    provider: 'adapter-anthropic' | 'adapter-deepseek' | 'adapter-openai'
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
