import type { AppContext } from '../../../core/context/types.ts'
import type { PuppetInstance } from '../../../core/puppet/types.ts'

export type HtnTask = {
  identifier: string
  conditions: {
    [key: string]: (props: ValueProps) => boolean
    // [key: string]: Promise<{ success: boolean; payload: any }>
  }
  effects: {
    [key: string]: {
      value: (props: ValueProps) => boolean
      trigger: (
        props: TriggerProps,
      ) => Promise<{ success: boolean; payload: any }>
    }
  }
  actions: {
    [key: string]: (
      props: TriggerProps,
    ) => Promise<{ success: boolean; payload: any }>
  }
}

export type GoalProps = {
  _puppet: PuppetInstance
  _app: AppContext
  // [key: string]: any
}

export type ValueProps = {
  _puppet: PuppetInstance
  _app: AppContext
  // [key: string]: any
}

export type TriggerProps = {
  _puppet: PuppetInstance
  _app: AppContext
  // [key: string]: any
}
