import type { AppContext } from '../../../core/context/types.ts'
import type { PuppetInstance } from '../../../core/puppet/types.ts'
import type { PuppetState } from '../types.ts'

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
  state: PuppetState
  _app: AppContext
  [key: string]: any
}

export type ValueProps = {
  state: PuppetState
  _app: AppContext
  [key: string]: any
}

export type TriggerProps = {
  _puppet: PuppetInstance
  state: PuppetState
  _app: AppContext
  [key: string]: any
}
