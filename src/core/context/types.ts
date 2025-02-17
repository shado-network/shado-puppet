import type { Puppet } from '../../core/puppet'
import type {
  AbstractPlugin,
  AbstractLogger,
  AbstractSandbox,
} from '../abstract/types.ts'

export type AppContext = {
  config: {
    sandboxMode: boolean
    pluginsPath: string
  }
  core: {
    puppets: Puppet[]
  }
  plugins: {
    [key: string]: AbstractPlugin
  }
  utils: {
    // TODO: Update to the proper type from the plugin?
    logger: undefined | AbstractLogger
    sandbox: undefined | AbstractSandbox
  }
}
