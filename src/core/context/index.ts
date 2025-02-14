import path from 'path'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

import type { AppContext } from './types.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const _app: AppContext = {
  config: {
    sandboxMode: !!process.env['SANDBOX_MODE'] || true,
    pluginsPath: path.join(__dirname, '../../', 'plugin'),
  },
  core: {
    puppets: [],
  },
  plugins: {},
  utils: {
    logger: null,
  },
}
