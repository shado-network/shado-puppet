import type { Puppet } from '../../core/puppet'
import type { AbstractAppPlugin, AbstractLogger } from '../abstract/types.ts'

export type AppContext = {
  config: {
    sandboxMode: boolean
    pluginsPath: string
  }
  core: {
    puppets: Puppet[]
  }
  plugins: {
    [key: string]: AbstractAppPlugin
  }
  utils: {
    // TODO: Update to the proper type from the plugin?
    logger: undefined | AbstractLogger
  }
}
