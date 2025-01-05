import { telegramRuntime } from './runtime.telegram.ts'
import { twitterRuntime } from './runtime.twitter.ts'

export const runtimes = {
  telegram: telegramRuntime,
  twitter: twitterRuntime,
}
