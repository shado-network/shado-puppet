import fs from 'fs'
import path from 'path'

import type { PuppetInstance } from '@core/puppet/types'

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
    puppetId: PuppetInstance['config']['id'],
  ) => {
    const cookiesFilepath = path.join(
      ...cacheDirectoryPaths,
      `twitter_cookies_${puppetId}.json`,
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
