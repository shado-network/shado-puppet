import type { GoalProps } from '../tasks/types'

export const defaultGoals = {
  // Telegram
  // NOTE: Must have a Telegram client enabled.
  'telegram-has-client': (props: GoalProps) => {
    return props.state['telegram-has-client'] === true
  },
  // NOTE: Wants to reply no longer than 5 minute ago.
  'telegram-last-replied': (props: GoalProps) => {
    return props.state['telegram-last-replied'] >= Date.now() - 1 * 1000
  },
  // Twitter
  // NOTE: Must have a Twitter client enabled.
  'twitter-has-client': (props: GoalProps) => {
    return props.state['twitter-has-client'] === true
  },
}
