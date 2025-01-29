import dotenv from 'dotenv'

import type { AppContext } from './types'

dotenv.config()

export const _app: AppContext = {
  config: {
    sandboxMode: !!process.env['SANDBOX_MODE'] || true,
  },
  core: {
    puppets: [],
  },
  utils: {
    logger: null,
  },
}
