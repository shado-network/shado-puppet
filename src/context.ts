import type { CoreLogger } from './plugin/core-logger'
import type { Stage } from './core/stage'
import type { Puppet } from './core/puppet'

type Context = {
  config: unknown
  core: {
    _logger: null | CoreLogger
    stage: null | Stage
    puppets: Puppet[]
  }
}

export const context: Context = {
  config: {},
  core: {
    _logger: null,
    stage: null,
    puppets: [],
  },
}
