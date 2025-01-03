export type PuppetDefinition = {
  id: string
  name: string
  //
  agentProvider: 'shado' | 'eliza'
  modelProvider: 'openai' | 'anthropic'
  interfaces: ('twitter' | 'telegram')[]
  //
  bio: string[]
  //
  twitter?: {
    username: string
  }
}
