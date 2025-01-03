import fs from 'fs'
import path from 'path'

import type { PuppetDefinition } from '../../../core/types/puppet.ts'

export const cookies = {
  retrieve: (cookiesFilepath: string) => {
    const rawFile = fs.readFileSync(cookiesFilepath, 'utf-8')
    const cookies = JSON.parse(rawFile)

    return cookies
  },
  store: (cookies: any[], cookiesFilepath: string) => {
    fs.writeFileSync(cookiesFilepath, JSON.stringify(cookies), 'utf-8')
  },
  getFilepath: (
    cacheDirectoryPaths: string[],
    agentDefinition: PuppetDefinition,
  ) => {
    const cookiesFilepath = path.join(
      ...cacheDirectoryPaths,
      `twitter_cookies_${agentDefinition.id}.json`,
    )

    return cookiesFilepath
  },
  createDirectory: (cacheDirectoryPaths: string[]) => {
    const cookiesDirpath = path.join(...cacheDirectoryPaths)
    const cookiesDirectory = path.dirname(cookiesDirpath)

    if (!fs.existsSync(cookiesDirectory)) {
      fs.mkdirSync(cookiesDirectory, { recursive: true })
    }
  },

  hasPreviousCookies: (cookiesFilepath: string) => {
    return fs.existsSync(cookiesFilepath)
  },
  toCookieStrings: async (cookiesArray: any[]) => {
    const cookieStrings = cookiesArray.map((cookie) => {
      const cookieString = `${cookie.key}=${cookie.value} Domain=${cookie.domain} Path=${cookie.path} ${cookie.secure ? 'Secure' : ''} ${cookie.httpOnly ? 'HttpOnly' : ''} SameSite=${cookie.sameSite || 'Lax'}`
      return cookieString
    })

    return cookieStrings
  },
}
