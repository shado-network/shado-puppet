import { fileURLToPath } from 'url'
import path from 'path'

import { Scraper, SearchMode } from 'agent-twitter-client'
import type { Tweet } from 'agent-twitter-client'

import { cookies } from './libs/utils.ts'
import { asyncSleep } from '../../core/libs/utils.async.ts'
import type { AppContext } from '../../core/context/types.ts'
import type { PuppetInstance } from '../../core/puppet/types.ts'
import type { AbstractAppPlugin } from '../../core/abstract/types.ts'

// TODO: Find a better way.
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const cacheDirectoryPaths = [__dirname, '../../../cache/twitter']

class TwitterClientPlugin {
  config = {
    MAX_LOGIN_ATTEMPTS: 3,
    RETRY_LOGIN_ATTEMPTS_INTERVAL_IN_SECONDS: 2,
  }

  //

  client: Scraper
  clientConfig: any = {}
  clientSecrets: any = {}

  threads: string[] = []
  messages: any[] = []

  //

  _app: AppContext
  _puppet: PuppetInstance

  //

  constructor(
    clientConfig: any,
    clientSecrets: any,
    _puppet: PuppetInstance,
    _app: AppContext,
  ) {
    this._app = _app
    this._puppet = _puppet

    this.clientConfig = {
      ...this.clientConfig,
      ...clientConfig,
    }

    this.clientSecrets = {
      ...this.clientSecrets,
      ...clientSecrets,
    }

    try {
      this.client = new Scraper()
    } catch (error) {
      this._app.utils.logger.send({
        type: 'ERROR',
        origin: {
          type: 'PUPPET',
          id: this._puppet.config.id,
        },
        data: {
          message: 'Could not connect to Twitter bot',
        },
      })
    }
  }

  getMessageThreads = () => {
    return this.threads
  }

  addMessageThread = (threadIdentifier: string) => {
    this.threads.push(threadIdentifier)
  }

  // getMessages = () => {
  //   return this.messages.filter((message) => !message.isRead)
  // }

  // clearReadMessages = () => {
  //   this.messages = this.messages.filter((message) => !message.isRead)
  // }

  login = async () => {
    cookies.createDirectory(cacheDirectoryPaths)
    const cookiesFilepath = cookies.getFilepath(
      cacheDirectoryPaths,
      this._puppet.config.id,
    )

    //

    try {
      if (cookies.hasPreviousCookies(cookiesFilepath)) {
        const cookiesArray = cookies.retrieve(cookiesFilepath)
        const cookieStrings = await cookies.toCookieStrings(cookiesArray)
        await this.client.setCookies(cookieStrings)

        this._app.utils.logger.send({
          type: 'INFO',
          origin: {
            type: 'PUPPET',
            id: this._puppet.config.id,
          },
          data: {
            message: "Found it's previous Twitter cookies",
          },
        })
      }

      let loginAttempts = 0

      while (true) {
        this._app.utils.logger.send({
          type: 'LOG',
          origin: {
            type: 'PUPPET',
            id: this._puppet.config.id,
          },
          data: {
            message: `Twitter login attempt #${loginAttempts + 1}`,
          },
        })

        await this.client.login(
          this.clientSecrets.username,
          this.clientSecrets.password,
          this.clientSecrets.email,
        )

        if (await this.client.isLoggedIn()) {
          this._app.utils.logger.send({
            type: 'SUCCESS',
            origin: {
              type: 'PUPPET',
              id: this._puppet.config.id,
            },
            data: {
              message: `Logged into Twitter`,
            },
          })

          try {
            const cookiesArray = await this.client.getCookies()
            cookies.store(cookiesArray, cookiesFilepath)

            this._app.utils.logger.send({
              type: 'SUCCESS',
              origin: {
                type: 'PUPPET',
                id: this._puppet.config.id,
              },
              data: {
                message: `Stored it's new Twitter cookies`,
              },
            })
          } catch (error) {
            this._app.utils.logger.send({
              type: 'ERROR',
              origin: {
                type: 'PUPPET',
                id: this._puppet.config.id,
              },
              data: {
                message: `Could not store it's new Twitter cookies`,
              },
            })
          }

          break
        }

        loginAttempts++

        if (loginAttempts > this.config.MAX_LOGIN_ATTEMPTS) {
          this._app.utils.logger.send({
            type: 'ERROR',
            origin: {
              type: 'PUPPET',
              id: this._puppet.config.id,
            },
            data: {
              message: `Failed to log in to Twitter after ${loginAttempts} attempts`,
            },
          })

          throw `Failed to log in to Twitter after ${loginAttempts} attempts`
          break
        }

        await asyncSleep(
          this.config.RETRY_LOGIN_ATTEMPTS_INTERVAL_IN_SECONDS *
            (loginAttempts + 1),
        )
      }

      return true
    } catch (error) {
      this._app.utils.logger.send({
        type: 'ERROR',
        origin: {
          type: 'PUPPET',
          id: this._puppet.config.id,
        },
        data: {
          message: `Error logging in to Twitter`,
          payload: { error },
        },
      })

      return false
    }
  }

  sendMessage = async (message: string) => {
    if (this._app.config.sandboxMode) {
      this._app.utils.logger.send({
        type: 'SANDBOX',
        origin: {
          type: 'PUPPET',
          id: this._puppet.config.id,
        },
        data: {
          message: 'client-twitter | sendMessage()',
          payload: { message },
        },
      })

      return
    }

    const response = await this.client.sendTweet(message)
    const json = await response.json()

    console.log('client-twitter | sendMessage()', { json })
  }
}

export default {
  identifier: 'client-twitter',
  description: 'Wrapper for OpenAI interaction through LangChain.',
  key: 'twitter',
  plugin: TwitterClientPlugin,
} satisfies AbstractAppPlugin
