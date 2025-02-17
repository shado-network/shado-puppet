import { TwitterApi } from 'twitter-api-v2'
import type { IClientSettings, TwitterApiTokens } from 'twitter-api-v2'

import type { AppContext } from '../../core/context/types.ts'
import type { PuppetInstance } from '../../core/puppet/types.ts'
import type { AbstractPlugin } from '../../core/abstract/types.ts'

class TwitterApiClientPlugin {
  config = {}

  //

  client: TwitterApi
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

    this._app.utils.logger.send({
      type: 'SUCCESS',
      origin: {
        type: 'PUPPET',
        id: this._puppet.config.id,
      },
      data: {
        message: `Loaded client plugin "client-twitter-api"`,
      },
    })
  }

  login = async () => {
    try {
      const credentials: TwitterApiTokens = {
        appKey: this.clientSecrets.appKey,
        appSecret: this.clientSecrets.appSecret,
        accessToken: this.clientSecrets.accessToken,
        accessSecret: this.clientSecrets.accessSecret,
      }

      const settings: Partial<IClientSettings> = {}

      this.client = new TwitterApi(credentials, settings)

      // const current = await this.client.currentUser()
      // console.log({ current })

      // this.client.login()

      // this._app.utils.logger.send({
      //   type: 'SUCCESS',
      //   origin: {
      //     type: 'PUPPET',
      //     id: this._puppet.config.id,
      //   },
      //   data: {
      //     message: `Connected to Twitter bot`,
      //   },
      // })

      return true
    } catch (error) {
      this._app.utils.logger.send({
        type: 'ERROR',
        origin: {
          type: 'PUPPET',
          id: this._puppet.config.id,
        },
        data: {
          message: `Error connecting to Twitter bot`,
          payload: { error },
        },
      })

      return false
    }
  }

  getMessageThreads = () => {
    return this.threads
  }

  addMessageThread = (threadIdentifier: string) => {
    this.threads.push(threadIdentifier)
  }

  sendMessage = async (message: string) => {
    if (this._app.config.sandboxMode) {
      this._app.utils.sandbox.send({
        type: 'SANDBOX',
        origin: {
          type: 'PUPPET',
          id: this._puppet.config.id,
        },
        data: {
          message: 'client-twitter-api | sendMessage()',
          payload: { message },
        },
      })

      return
    }

    const response = await this.client.v2.tweet(message)
    // console.log('!!!', 'client-twitter | sendMessage()', { response })
  }
}

export default {
  identifier: 'client-twitter-api',
  description: 'Wrapper for OpenAI interaction through LangChain.',
  key: 'twitter',
  plugin: TwitterApiClientPlugin,
} satisfies AbstractPlugin
