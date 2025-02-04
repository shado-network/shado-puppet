import type { AppContext } from './types'

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
