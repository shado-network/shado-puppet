import type { ShadoLogger } from '../../plugin/shado-logger'
import type { Puppet } from '../../core/puppet'

export type AppContext = {
  config: {
    sandboxMode: boolean
    [key: string]: unknown
  }
  core: {
    puppets: Puppet[]
  }
  utils: {
    logger: null | ShadoLogger
  }
}
