import { fileURLToPath } from 'url'
import path from 'path'

import { Scraper, SearchMode } from 'agent-twitter-client'
import type { Tweet } from 'agent-twitter-client'

import { cookies } from './libs/utils.ts'
import { asyncSleep } from '../../core/libs/utils.async.ts'
import type { AppContext } from '../../core/context/types.ts'
import type { PuppetInstance } from '../../core/puppet/types.ts'
import type { AppPlugin } from '../types.ts'

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
        source: 'PUPPET',
        puppetId: this._puppet.config.id,
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
          source: 'PUPPET',
          puppetId: this._puppet.config.id,
          message: "Found it's previous Twitter cookies",
        })
      }

      let loginAttempts = 0

      while (true) {
        this._app.utils.logger.send({
          type: 'LOG',
          source: 'PUPPET',
          puppetId: this._puppet.config.id,
          message: `Twitter login attempt #${loginAttempts + 1}`,
        })

        await this.client.login(
          this.clientSecrets.username,
          this.clientSecrets.password,
          this.clientSecrets.email,
        )

        if (await this.client.isLoggedIn()) {
          this._app.utils.logger.send({
            type: 'SUCCESS',
            source: 'PUPPET',
            puppetId: this._puppet.config.id,
            message: `Logged into Twitter`,
          })

          try {
            const cookiesArray = await this.client.getCookies()
            cookies.store(cookiesArray, cookiesFilepath)

            this._app.utils.logger.send({
              type: 'SUCCESS',
              source: 'PUPPET',
              puppetId: this._puppet.config.id,
              message: `Stored it's new Twitter cookies`,
            })
          } catch (error) {
            this._app.utils.logger.send({
              type: 'ERROR',
              source: 'PUPPET',
              puppetId: this._puppet.config.id,
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
            puppetId: this._puppet.config.id,
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
        puppetId: this._puppet.config.id,
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
        puppetId: this._puppet.config.id,
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
  getMessages = async () => {
    if (await !this.client.isLoggedIn()) {
      return
    }
    const userId = 'user'
    const message = `Interesting ${this._puppet.name}, tell me more?`

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
        puppetId: this._puppet.config.id,
        message: 'Error',
        payload: { error },
      })
    }
    this._app.utils.logger.send({
      type: 'LOG',
      source: 'AGENT',
      puppetId: this._puppet.config.id,
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
    //   puppetId: puppet.id,
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

export default {
  identifier: 'client-twitter',
  description: 'Wrapper for OpenAI interaction through LangChain.',
  key: 'twitter',
  plugin: TwitterClientPlugin,
} satisfies AppPlugin
