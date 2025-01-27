import { MIN_IN_MSEC, SEC_IN_MSEC } from '../../../core/libs/constants.ts'
import type { GoalProps } from '../tasks/types'

export const defaultGoals = {
  // Telegram
  // NOTE: Wants to reply no longer than 1 second ago.
  'telegram-last-replied': (props: GoalProps) => {
    return props.state['telegram-last-replied'] >= Date.now() - 1 * SEC_IN_MSEC
  },
  // Twitter
  // // NOTE: DEBUG!
  // 'twitter-has-logged-in': (props: GoalProps) => {
  //   return props.state['twitter-has-logged-in'] === true
  // },
  // // NOTE: Wants to have some messages.
  // 'twitter-has-messages': (props: GoalProps) => {
  //   return props.state['twitter-has-messages'] === true
  // },
  // NOTE: Wants to reply no longer than 15 minutes ago.
  'twitter-last-sent': (props: GoalProps) => {
    return props.state['twitter-last-sent'] >= Date.now() - 15 * MIN_IN_MSEC
  },
}
