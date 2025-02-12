export type PuppetInstance = {
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
      goals: any
      state: any
      [key: string]: any
    }
  }
  knowledge?: unknown
  //
  clients: {
    [key: string]: any
  }
}

export type PuppetConfig = {
  id: string
  name: string
  //
  planner: {
    provider: 'shado-planner-htn' | 'shado-planner-sm' | 'shado-planner-bt'
    config?: { [key: string]: any }
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
