import type { AppContext } from '../../../core/context/types'
import type { Puppet } from '../../../core/puppet/types'

export type Task = {
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
  state: {
    [key: string]: any
  }
  _app: AppContext
  [key: string]: any
}

export type ValueProps = {
  state: {
    [key: string]: any
  }
  _app: AppContext
  [key: string]: any
}

export type TriggerProps = {
  puppet: Puppet
  state: {
    [key: string]: any
  }
  _app: AppContext
  [key: string]: any
}
