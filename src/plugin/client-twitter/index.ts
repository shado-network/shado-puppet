import { fileURLToPath } from 'url'
import path from 'path'

import { Scraper, SearchMode } from 'agent-twitter-client'
import type { Tweet } from 'agent-twitter-client'

import { cookies } from './libs/utils.ts'
import { asyncSleep } from '../../core/libs/utils.ts'
import type { AppContext } from '../../core/context/types'
import type { PuppetConfig } from '../../core/puppet/types'

// TODO: Find a better way.
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const cacheDirectoryPaths = [__dirname, '../../../cache/twitter']

export class TwitterClientPlugin {
  config = {
    MAX_LOGIN_ATTEMPTS: 3,
    RETRY_LOGIN_ATTEMPTS_INTERVAL_IN_SECONDS: 2,
  }

  //

  client: Scraper
  clientConfig: any = {}

  threads: string[] = []
  messages: any[] = []

  //

  puppetConfig: PuppetConfig
  _app: AppContext

  //

  constructor(puppetConfig: PuppetConfig, _app: AppContext) {
    this._app = _app

    this.puppetConfig = puppetConfig

    this.clientConfig = {
      ...this.clientConfig,
      ...this.puppetConfig.clients.find((client: any) => {
        return client.identifier === 'client-twitter'
      }),
    }

    this._app.utils.logger.send({
      type: 'SUCCESS',
      source: 'PUPPET',
      puppetId: this.puppetConfig.id,
      message: `Loaded client plugin "client-twitter"`,
    })

    try {
      this.client = new Scraper()
    } catch (error) {
      this._app.utils.logger.send({
        type: 'ERROR',
        source: 'PUPPET',
        puppetId: this.puppetConfig.id,
        message: 'Could not connect to Twitter bot',
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
      this.puppetConfig,
    )

    //

    try {
      if (cookies.hasPreviousCookies(cookiesFilepath)) {
        const cookiesArray = cookies.retrieve(cookiesFilepath)
        const cookieStrings = await cookies.toCookieStrings(cookiesArray)
        await this.client.setCookies(cookieStrings)

        this._app.utils.logger.send({
          type: 'INFO',
          source: 'PUPPET',
          puppetId: this.puppetConfig.id,
          message: "Found it's previous Twitter cookies",
        })
      }

      let loginAttempts = 0

      while (true) {
        this._app.utils.logger.send({
          type: 'LOG',
          source: 'PUPPET',
          puppetId: this.puppetConfig.id,
          message: `Twitter login attempt #${loginAttempts + 1}`,
        })

        await this.client.login(
          this.clientConfig.secrets.username,
          this.clientConfig.secrets.password,
          this.clientConfig.secrets.email,
        )

        if (await this.client.isLoggedIn()) {
          this._app.utils.logger.send({
            type: 'SUCCESS',
            source: 'PUPPET',
            puppetId: this.puppetConfig.id,
            message: `Logged into Twitter`,
          })

          try {
            const cookiesArray = await this.client.getCookies()
            cookies.store(cookiesArray, cookiesFilepath)

            this._app.utils.logger.send({
              type: 'SUCCESS',
              source: 'PUPPET',
              puppetId: this.puppetConfig.id,
              message: `Stored it's new Twitter cookies`,
            })
          } catch (error) {
            this._app.utils.logger.send({
              type: 'ERROR',
              source: 'PUPPET',
              puppetId: this.puppetConfig.id,
              message: `Could not store it's new Twitter cookies`,
            })
          }

          break
        }

        loginAttempts++

        if (loginAttempts > this.config.MAX_LOGIN_ATTEMPTS) {
          this._app.utils.logger.send({
            type: 'ERROR',
            source: 'PUPPET',
            puppetId: this.puppetConfig.id,
            message: `Failed to log in to Twitter after ${loginAttempts} attempts`,
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
        source: 'PUPPET',
        puppetId: this.puppetConfig.id,
        message: `Error logging in to Twitter`,
        payload: { error },
      })

      return false
    }
  }

  sendMessage = async (message: string) => {
    if (this._app.config.sandboxMode) {
      this._app.utils.logger.send({
        type: 'SANDBOX',
        source: 'PUPPET',
        puppetId: this.puppetConfig.id,
        message: 'client-twitter | sendMessage()',
        payload: {
          message: message,
        },
      })

      return
    }

    const response = await this.client.sendTweet(message)
    const json = await response.json()

    console.log('client-twitter | sendMessage()', { json })
  }

  /*
  getMessages = async (messages) => {
    if (await !this.client.isLoggedIn()) {
      return
    }
    const userId = 'user'
    const message = `Interesting ${this.puppetConfig.name}, tell me more?`

    const tweets = []

    try {
      // const rawTweets = this.client.getTweetsAndReplies('ShadoNetwork', 120)
      // const rawTweets = await this.client.getTweets('ShadoNetwork', 10)
      // const rawTweets = this.client.getTweetsAndReplies('ShadoNetwork')
      // const rawTweets = await this.client.fetchSearchTweets(
      const rawTweets = this.client.searchTweets(
        '@ShadoNetwork',
        50,
        SearchMode.Latest,
      )

      if (!rawTweets) {
        return
      }

      // for await (const rawTweet of rawTweets.tweets) {
      for await (const rawTweet of rawTweets) {
        const parsedTweet: Partial<Tweet> = {
          id: rawTweet.id,
          conversationId: rawTweet.conversationId,
          thread: rawTweet.thread,
          userId: rawTweet.userId,
          username: rawTweet.username,
          name: rawTweet.name,
          text: rawTweet.text,
          hashtags: rawTweet.hashtags,
          mentions: rawTweet.mentions,
          inReplyToStatus: rawTweet.inReplyToStatus,
          inReplyToStatusId: rawTweet.inReplyToStatusId,
          urls: rawTweet.urls,
          timestamp: rawTweet.timestamp,
          timeParsed: rawTweet.timeParsed,
        }

        tweets.push(parsedTweet)
      }
    } catch (error) {
      this._app.utils.logger.send({
        type: 'ERROR',
        source: 'PUPPET',
        puppetId: this.puppetConfig.id,
        message: 'Error',
        payload: error,
      })
    }
    this._app.utils.logger.send({
      type: 'LOG',
      source: 'AGENT',
      puppetId: this.puppetConfig.id,
      message: 'Read some Tweets:',
      payload: {
        tweets: tweets,
      },
    })

    // messages.push({
    //   role: userId,
    //   content: message,
    // })

    // this._app.utils.logger.send({
    //   type: 'LOG',
    //   source: 'USER',
    //   userId: userId,
    //   message: 'Wrote a message:',
    //   payload: {
    //     message: message,
    //   },
    // })

    // this._app.utils.logger.send({
    //   type: 'LOG',
    //   source: 'PUPPET',
    //   puppetId: puppetConfig.id,
    //   message: 'Read a message:',
    //   payload: {
    //     message: message,
    //   },
    // })

    return {
      user: userId,
      message: message,
      shouldReply: true,
    }
  }
  */
}
