import type { CoreLogger } from './plugin/core-logger'
import type { Puppet } from './core/puppet'

type Context = {
  config: unknown
  core: {
    _logger: null | CoreLogger
    puppets: Puppet[]
  }
}

export const context: Context = {
  config: {},
  core: {
    _logger: null,
    puppets: [],
  },
}
