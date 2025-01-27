import type { CoreLogger } from '../../plugin/core-logger'
import type { Puppet } from '../../core/puppet'

export type AppContext = {
  config: {
    sandbox: boolean
    [key: string]: unknown
  }
  core: {
    puppets: Puppet[]
  }
  utils: {
    logger: null | CoreLogger
  }
}
