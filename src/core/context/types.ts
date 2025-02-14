import type { Puppet } from '../../core/puppet'
import type { AppPlugin } from '../../plugin/types.ts'

export type AppContext = {
  config: {
    sandboxMode: boolean
    pluginsPath: string
    [key: string]: unknown
  }
  core: {
    puppets: Puppet[]
  }
  plugins: {
    [key: string]: AppPlugin
  }
  utils: {
    // TODO: Update to the proper type from the plugin.
    logger: undefined | any
  }
}
