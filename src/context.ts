import type { CoreLogger } from './plugin/core-logger'
import type { Puppet } from './core/puppet'

export type AppContext = {
  config: unknown
  core: {
    puppets: Puppet[]
  }
  utils: {
    logger: null | CoreLogger
  }
}

export const _app: AppContext = {
  config: {},
  core: {
    puppets: [],
  },
  utils: {
    logger: null,
  },
}
