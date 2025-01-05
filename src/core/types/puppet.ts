export type Puppet = {
  id: string
  definition: PuppetDefinition
  //
  model: unknown
  interfaces: any | { name: string; client: unknown }[]
}

export type PuppetDefinition = {
  id: string
  name: string
  //
  planner: {
    provider: 'core-planner-htn' | 'core-planner-sm' | 'core-planner-bt'
    config?: any
  }
  model: {
    provider: 'client-anthropic' | 'client-openai'
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
