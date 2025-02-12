import type { Puppet } from '../../core/puppet'

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
    [key: string]: any
  }
  utils: {
    // TODO: Update to the proper type from the plugin.
    logger: null | any
  }
}
